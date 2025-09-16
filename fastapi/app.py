import os
import shutil
import tempfile
import asyncio
import traceback
import json
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
# from langchain.vectorstores.chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
# from langchain.document_loaders.pdf import PyPDFDirectoryLoader, PyPDFLoader
# from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader, PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from langchain.schema import Document as LCDocument
# from chromadb.config import Settings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="RAG API", 
    description="API for document upload and RAG querying",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHROMA_PATH = "chroma"
DATA_PATH = "data"

# Check required environment variables
required_env_vars = ["PINECONE_API_KEY", "OPENAI_API_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {missing_vars}")

# Initialize embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=1536)

try:
    _ = embeddings.embed_query("ping")
except Exception as e:
    raise RuntimeError(f"OpenAI embeddings init failed: {e}")

INDEX_NAME = os.getenv("PINECONE_INDEX", "neo-docs")


try:
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
except Exception as e:
    raise ValueError(f"Failed to initialize Pinecone client: {e}")

try:
    if INDEX_NAME not in {i.name for i in pc.list_indexes().indexes}:
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,  # must match your embeddings dimension
            metric="cosine",
            spec=ServerlessSpec(
                cloud=os.getenv("PINECONE_CLOUD", "aws"),
                region=os.getenv("PINECONE_REGION", "us-east-1"),
            ),
        )
except Exception as e:
    print(f"Warning: Could not create Pinecone index: {e}")

# LangChain vectorstore wrapper - initialize lazily
try:
    vectorstore = PineconeVectorStore.from_existing_index(
        index_name=INDEX_NAME,
        embedding=embeddings
    )
except Exception as e:
    print(f"Warning: Could not initialize vectorstore: {e}")
    vectorstore = None

# Response models
class UploadResponse(BaseModel):
    message: str
    documents_processed: int

class QueryResponse(BaseModel):
    response: str
    sources: List[str]

class FlashcardRequest(BaseModel):
    topic: str
    num_flashcards: int = 10
    difficulty: str = "medium"  # easy, medium, hard

class Flashcard(BaseModel):
    question: str
    answer: str
    topic: str
    difficulty: str

class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]
    topic: str
    sources: List[str]

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

FLASHCARD_PROMPT_TEMPLATE = """
Based on the following context from uploaded documents, generate {num_flashcards} flashcards about {topic} at {difficulty} difficulty level.

Context:
{context}

---

Generate exactly {num_flashcards} flashcards about "{topic}" with {difficulty} difficulty. Each flashcard should:
1. Have a clear, concise question
2. Have a comprehensive but focused answer
3. Be based strictly on the provided context
4. Be appropriate for {difficulty} difficulty level

Format your response as a JSON array of objects, where each object has "question" and "answer" fields:

[
  {{
    "question": "Your question here",
    "answer": "Your answer here"
  }},
  ...
]

Ensure the JSON is valid and contains exactly {num_flashcards} flashcards.
"""

def load_documents():
    """Load documents from data directory - only works in local development"""
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="Data directory not found. This endpoint only works in local development.")
    document_loader = PyPDFDirectoryLoader(DATA_PATH)
    return document_loader.load()

def split_documents(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)

# def add_to_pinecone(chunks: list[Document]):
#     """Add documents to Pinecone vectorstore"""
#     if vectorstore is None:
#         raise HTTPException(status_code=500, detail="Vectorstore not initialized")
        
#     chunks_with_ids = calculate_chunk_ids(chunks)
    
#     # Get existing document IDs from Pinecone
#     try:
#         existing_docs = vectorstore.similarity_search("", k=10000)  # Get all docs
#         existing_ids = set()
#         for doc in existing_docs:
#             if "id" in doc.metadata:
#                 existing_ids.add(doc.metadata["id"])
#         print(f"Number of existing documents in DB: {len(existing_ids)}")
#     except Exception as e:
#         print(f"Error getting existing documents: {e}")
#         existing_ids = set()

#     new_chunks = []
#     for chunk in chunks_with_ids:
#         if chunk.metadata["id"] not in existing_ids:
#             new_chunks.append(chunk)

#     if len(new_chunks):
#         print(f"Adding new documents: {len(new_chunks)}")
#         try:
#             vectorstore.add_documents(new_chunks)
#             print("Successfully added documents to Pinecone")
#         except Exception as e:
#             print(f"Error adding documents to Pinecone: {e}")
#             raise e
#     else:
#         print("No new documents to add")

UPSERT_BATCH = 100  # small batches are safer on serverless

def add_to_pinecone(chunks: List[LCDocument]) -> None:
    chunks = calculate_chunk_ids(chunks)

    # 1) Embed texts explicitly (so errors surface here if any)
    texts = [c.page_content for c in chunks]
    try:
        embeddings_list = embeddings.embed_documents(texts)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    # 2) Upsert directly with Pinecone client (skip LangChain wrapper)
    try:
        # make sure index exists and dims match
        desc = pc.describe_index(INDEX_NAME)
        if desc.dimension != 1536:
            raise HTTPException(status_code=500, detail=f"Pinecone index dim {desc.dimension} != 1536")

        index = pc.Index(INDEX_NAME)

        # build vectors
        vectors = []
        for c, emb in zip(chunks, embeddings_list):
            meta = dict(c.metadata or {})
            # optional: store a short text snippet to keep metadata small
            meta["text"] = c.page_content
            vectors.append({"id": meta["id"], "values": emb, "metadata": meta})

        # batch upsert
        for i in range(0, len(vectors), UPSERT_BATCH):
            batch = vectors[i:i+UPSERT_BATCH]
            index.upsert(vectors=batch, namespace="")  # set your namespace if you use one

        print(f"Successfully added {len(vectors)} documents to Pinecone")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upsert failed: {e}")


def calculate_chunk_ids(chunks):
    last_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        current_page_id = f"{source}:{page}"

        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0

        chunk_id = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id
        
        chunk.metadata["id"] = chunk_id

    return chunks

def clear_database():
    """Clear all documents from Pinecone index"""
    try:
        # Check if index exists
        if INDEX_NAME not in {i.name for i in pc.list_indexes().indexes}:
            print("Index does not exist, nothing to clear")
            return
        
        # Delete all vectors from the index
        index = pc.Index(INDEX_NAME)
        index.delete(delete_all=True)
        print("Successfully cleared Pinecone database")
    except Exception as e:
        print(f"Error clearing Pinecone database: {e}")
        # Don't raise the error for 404 (index not found)
        if "404" not in str(e):
            raise e

def query_rag(query_text: str):
    """Query the RAG system using Pinecone"""
    if vectorstore is None:
        raise HTTPException(status_code=500, detail="Vectorstore not initialized")
        
    try:
        results = vectorstore.similarity_search_with_score(query_text, k=5)

        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)

        model = ChatOpenAI(model="gpt-4o")
        response_text = model.invoke(prompt)

        sources = [doc.metadata.get("id", None) for doc, _score in results]
        formatted_response = f"Response: {response_text}\nSources: {sources}"
        print(formatted_response)
        return response_text
    except Exception as e:
        print(f"Error querying RAG: {e}")
        raise e

def upload_documents_to_pinecone_from_file(file_path: str) -> int:
    """Upload a single PDF file to Pinecone database"""
    try:
        clear_database()
        # Load the PDF document
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Split documents into chunks
        chunks = split_documents(documents)
        
        # Add to Pinecone database
        add_to_pinecone(chunks)
        
        return len(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error Processing PDF: {str(e)}")

def upload_documents_to_pinecone_from_directory():
    """Upload all PDFs from the data directory to Pinecone database"""
    try:
        documents = load_documents()
        chunks = split_documents(documents)
        add_to_pinecone(chunks)
        return len(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")

def query_rag_from_pinecone(query_text: str) -> dict:
    """Query the RAG system and return response with sources"""
    if vectorstore is None:
        raise HTTPException(status_code=500, detail="Vectorstore not initialized")
        
    try:
        results = vectorstore.similarity_search_with_score(query_text, k=5)

        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)

        model = ChatOpenAI(model="gpt-4o")
        response_text = model.invoke(prompt)

        sources = [doc.metadata.get("id", None) for doc, _score in results]
        
        return {
            "response": str(response_text),
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying RAG: {str(e)}")

def generate_flashcards_from_rag(topic: str, num_flashcards: int = 10, difficulty: str = "medium") -> dict:
    """Generate flashcards for a specific topic using RAG system"""
    if vectorstore is None:
        raise HTTPException(status_code=500, detail="Vectorstore not initialized")
        
    try:
        # Search for relevant content based on the topic
        search_query = f"content related to {topic}"
        results = vectorstore.similarity_search_with_score(search_query, k=num_flashcards)

        if not results:
            raise HTTPException(status_code=404, detail=f"No relevant content found for topic: {topic}")

        # Combine context from multiple relevant documents
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        
        # Create flashcard generation prompt
        prompt_template = ChatPromptTemplate.from_template(FLASHCARD_PROMPT_TEMPLATE)
        prompt = prompt_template.format(
            context=context_text, 
            topic=topic,
            num_flashcards=num_flashcards,
            difficulty=difficulty
        )

        # Generate flashcards using OpenAI
        model = ChatOpenAI(model="gpt-4o", temperature=0.7)
        response_text = model.invoke(prompt)
        
        # Parse the JSON response
        try:
            flashcards_data = json.loads(str(response_text).strip())
            if not isinstance(flashcards_data, list):
                raise ValueError("Response is not a list")
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: try to extract JSON from the response
            response_str = str(response_text)
            start_idx = response_str.find('[')
            end_idx = response_str.rfind(']') + 1
            if start_idx != -1 and end_idx != 0:
                try:
                    print("response_str: " + response_str)
                    print("response_str[start_idx:end_idx]: " + response_str[start_idx:end_idx])
                    fixed_str = response_str[start_idx:end_idx].encode('utf-8').decode('unicode_escape')
                    flashcards_data = json.loads(fixed_str)
                except json.JSONDecodeError:
                    raise HTTPException(status_code=500, detail="Failed to parse flashcards from AI response")
            else:
                return {
                    "flashcards": [],
                    "topic": topic,
                    "sources": []
                }

        # Convert to Flashcard objects
        flashcards = []
        for item in flashcards_data[:num_flashcards]:  # Ensure we don't exceed requested number
            if isinstance(item, dict) and "question" in item and "answer" in item:
                flashcards.append(Flashcard(
                    question=item["question"],
                    answer=item["answer"],
                    topic=topic,
                    difficulty=difficulty
                ))

        sources = [doc.metadata.get("id", None) for doc, _score in results]
        
        return {
            "flashcards": flashcards,
            "topic": topic,
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")

# API Endpoints
@app.post("/upload-documents", response_model=UploadResponse)
async def upload_documents_to_pinecone(file: UploadFile = File(...)):
    """
    Upload a PDF file to the Pinecone database.
    The file will be processed, split into chunks, and added to the vector store.
    """
    # Check if file is PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create temporary file to save uploaded PDF
    tmp_file_path = None
    try:
        # Always write into /tmp on Vercel and close before processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf", dir="/tmp") as tmp_file:
            tmp_file_path = tmp_file.name
            # stream in chunks (avoid reading whole file into RAM)
            while True:
                chunk = await file.read(1024 * 1024)  # 1 MB
                if not chunk:
                    break
                tmp_file.write(chunk)
            tmp_file.flush()
            os.fsync(tmp_file.fileno())

        # Now the file is closed and fully on disk; process it
        documents_processed = upload_documents_to_pinecone_from_file(tmp_file_path)

        await asyncio.sleep(5)

        return UploadResponse(
            message=f"Successfully uploaded and processed {file.filename}",
            documents_processed=documents_processed
        )

    except FileNotFoundError as e:
        # Path doesn't exist OR your processing code tried to call a missing binary
        raise HTTPException(status_code=400, detail=f"Error Processing PDF: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error Processing PDF: {e}")
    finally:
        if tmp_file_path and os.path.exists(tmp_file_path):
            try:
                os.unlink(tmp_file_path)
            except Exception:
                pass

@app.post("/query", response_model=QueryResponse)
async def query_rag_from_pinecone_api(query: str):
    """
    Query the RAG system with a text query.
    Returns the AI response along with source document IDs.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    result = query_rag_from_pinecone(query)
    return QueryResponse(
        response=result["response"],
        sources=result["sources"]
    )

@app.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards_api(request: FlashcardRequest):
    """
    Generate flashcards for a specific topic from uploaded PDF documents.
    
    Parameters:
    - topic: The subject/topic for which to generate flashcards
    - num_flashcards: Number of flashcards to generate (default: 10)
    - difficulty: Difficulty level - easy, medium, or hard (default: medium)
    
    Returns flashcards with questions and answers based on the uploaded document content.
    """
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    if request.num_flashcards < 1 or request.num_flashcards > 10:
        raise HTTPException(status_code=400, detail="Number of flashcards must be between 1 and 10")
    
    if request.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Difficulty must be 'easy', 'medium', or 'hard'")
    
    result = generate_flashcards_from_rag(
        topic=request.topic,
        num_flashcards=request.num_flashcards,
        difficulty=request.difficulty
    )
    
    return FlashcardResponse(
        flashcards=result["flashcards"],
        topic=result["topic"],
        sources=result["sources"]
    )

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "RAG API is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "upload": "/upload-documents",
            "query": "/query",
            "generate_flashcards": "/generate-flashcards",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Vercel"""
    try:
        vectorstore_status = "initialized" if vectorstore is not None else "not_initialized"
        
        return {
            "status": "healthy",
            "vectorstore": vectorstore_status,
            "pinecone_index": INDEX_NAME,
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
