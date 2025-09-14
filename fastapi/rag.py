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
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader, PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from chromadb.config import Settings

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="RAG API", description="API for document upload and RAG querying")

CHROMA_PATH = "chroma"
DATA_PATH = "data"

embeddings = OpenAIEmbeddings(model="text-embedding-3-large", dimensions=1536)

db_client_settings = Settings(
    anonymized_telemetry=False,   # <-- prevents the telemetry crash
    is_persistent=True,
    persist_directory=CHROMA_PATH
)

db = Chroma(
    collection_name="neo_docs",           # your collection
    embedding_function=embeddings,        # your embeddings object
    persist_directory=CHROMA_PATH,
    client_settings=db_client_settings
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

def add_to_chroma(chunks: list[Document]):
    chunks_with_ids = calculate_chunk_ids(chunks)

    existing_items = db.get(include=[])
    existing_ids = set(existing_items["ids"])
    print(f"Number of existing documents in DB: {len(existing_ids)}")

    new_chunks = []
    for chunk in chunks_with_ids:
        if chunk.metadata["id"] not in existing_ids:
            new_chunks.append(chunk)

    if len(new_chunks):
        print(f"Adding new documents: {len(new_chunks)}")
        new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
        db.add_documents(new_chunks, ids=new_chunk_ids)
        db.persist()
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
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)

def query_rag(query_text: str):
    # embedding_function = embeddings
    # db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

    results = db.similarity_search_with_score(query_text, k=5)

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)

    model = ChatOpenAI(model="gpt-4o")
    response_text = model.invoke(prompt)

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    formatted_response = f"Response: {response_text}\nSources: {sources}"
    print(formatted_response)
    return response_text

def upload_documents_to_chroma_from_file(file_path: str) -> int:
    """Upload a single PDF file to Chroma database"""
    try:
        # Load the PDF document
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Split documents into chunks
        chunks = split_documents(documents)
        
        # Add to Chroma database
        add_to_chroma(chunks)
        
        return len(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def upload_documents_to_chroma_from_directory():
    """Upload all PDFs from the data directory to Chroma database"""
    try:
        clear_database()
        documents = load_documents()
        chunks = split_documents(documents)
        add_to_chroma(chunks)
        return len(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")

def query_rag_from_chroma(query_text: str) -> dict:
    """Query the RAG system and return response with sources"""
    try:
        # embedding_function = embeddings
        # db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

        results = db.similarity_search_with_score(query_text, k=5)

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
async def upload_documents_to_chroma(file: UploadFile = File(...)):
    """
    Upload a PDF file to the Chroma database.
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
            documents_processed = upload_documents_to_chroma_from_file(tmp_file_path)
            
            return UploadResponse(
                message=f"Successfully uploaded and processed {file.filename}",
                documents_processed=documents_processed
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

@app.post("/query", response_model=QueryResponse)
async def query_rag_from_chroma_api(query: str):
    """
    Query the RAG system with a text query.
    Returns the AI response along with source document IDs.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    result = query_rag_from_chroma(query)
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