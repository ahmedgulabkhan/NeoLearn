import os
import shutil
import tempfile
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
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
# from chromadb.config import Settings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="RAG API", description="API for document upload and RAG querying")

CHROMA_PATH = "chroma"
DATA_PATH = "data"

embeddings = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=1536)

# db_client_settings = Settings(
#     anonymized_telemetry=False,   # <-- prevents the telemetry crash
#     is_persistent=True,
#     persist_directory=CHROMA_PATH
# )

# db = Chroma(
#     collection_name="neo_docs",           # your collection
#     embedding_function=embeddings,        # your embeddings object
#     persist_directory=CHROMA_PATH,
#     client_settings=db_client_settings
# )
INDEX_NAME = os.getenv("PINECONE_INDEX", "neo-docs")

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

# Create serverless index if it doesn't exist (choose region/cloud you set in env)
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

# LangChain vectorstore wrapper
vectorstore = PineconeVectorStore.from_existing_index(
    index_name=INDEX_NAME,
    embedding=embeddings
)

# Response models
class UploadResponse(BaseModel):
    message: str
    documents_processed: int

class QueryResponse(BaseModel):
    response: str
    sources: List[str]

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

def load_documents():
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

def add_to_pinecone(chunks: list[Document]):
    """Add documents to Pinecone vectorstore"""
    chunks_with_ids = calculate_chunk_ids(chunks)
    
    # Get existing document IDs from Pinecone
    try:
        existing_docs = vectorstore.similarity_search("", k=10000)  # Get all docs
        existing_ids = set()
        for doc in existing_docs:
            if "id" in doc.metadata:
                existing_ids.add(doc.metadata["id"])
        print(f"Number of existing documents in DB: {len(existing_ids)}")
    except Exception as e:
        print(f"Error getting existing documents: {e}")
        existing_ids = set()

    new_chunks = []
    for chunk in chunks_with_ids:
        if chunk.metadata["id"] not in existing_ids:
            new_chunks.append(chunk)

    if len(new_chunks):
        print(f"Adding new documents: {len(new_chunks)}")
        try:
            vectorstore.add_documents(new_chunks)
            print("Successfully added documents to Pinecone")
        except Exception as e:
            print(f"Error adding documents to Pinecone: {e}")
            raise e
    else:
        print("No new documents to add")

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
        # Load the PDF document
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Split documents into chunks
        chunks = split_documents(documents)
        
        # Add to Pinecone database
        add_to_pinecone(chunks)
        
        return len(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def upload_documents_to_pinecone_from_directory():
    """Upload all PDFs from the data directory to Pinecone database"""
    try:
        clear_database()
        documents = load_documents()
        chunks = split_documents(documents)
        add_to_pinecone(chunks)
        return len(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")

def query_rag_from_pinecone(query_text: str) -> dict:
    """Query the RAG system and return response with sources"""
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
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
        try:
            # Save uploaded file to temporary location
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
            
            # Process the PDF file
            documents_processed = upload_documents_to_pinecone_from_file(tmp_file_path)
            
            return UploadResponse(
                message=f"Successfully uploaded and processed {file.filename}",
                documents_processed=documents_processed
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

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

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "RAG API is running",
        "endpoints": {
            "upload": "/upload-documents",
            "query": "/query"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)