from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.RAGEngine import RAGEngine
from app.RAG.LLMClient import LLMClient
from app.api.routes import router as api_router
from app.prompts import RESEARCH_PROMPT
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):

    app.state.llm = LLMClient()
    app.state.paper_mgmt = PaperManagement(app.state.llm)
    app.state.rag_engine = RAGEngine(llm=app.state.llm, retriever=app.state.paper_mgmt, system=RESEARCH_PROMPT)
    yield

app = FastAPI(title="Research RAG API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)