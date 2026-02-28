from fastapi import Request
from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.RAGEngine import RAGEngine


def get_paper_mgmt(request: Request) -> PaperManagement:
    return request.app.state.paper_mgmt


def get_rag_engine(request: Request) -> RAGEngine:
    return request.app.state.rag_engine