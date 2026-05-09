import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from typing import List

VECTORSTORE_PATH = "vectorstore/faiss_index"


def get_embeddings():
    """HuggingFace free embeddings — koi API key nahi chahiye."""
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def create_vectorstore(chunks: List[str]) -> FAISS:
    embeddings = get_embeddings()
    vectorstore = FAISS.from_texts(chunks, embedding=embeddings)
    os.makedirs("vectorstore", exist_ok=True)
    vectorstore.save_local(VECTORSTORE_PATH)
    return vectorstore


def load_vectorstore() -> FAISS:
    embeddings = get_embeddings()
    return FAISS.load_local(
        VECTORSTORE_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )


def vectorstore_exists() -> bool:
    return os.path.exists(VECTORSTORE_PATH)