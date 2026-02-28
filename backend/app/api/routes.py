from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.api.dependencies import get_paper_mgmt, get_rag_engine
from app.core.ResearchSession import ResearchSession
from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.RAGEngine import RAGEngine
from app.api.schemas import CreateSessionResponse, AskRequest, AskResponse, SessionState

router = APIRouter(prefix="/api", tags=["api"])

# In-memory store for sessions (good for now)
SESSIONS: dict[str, SessionState] = {}


@router.get("/health")
def health():
    return {"ok": True}

@router.post("/session", response_model=CreateSessionResponse)
def create_session( pm: PaperManagement = Depends(get_paper_mgmt), rag: RAGEngine = Depends(get_rag_engine)):
    session = ResearchSession(paperManagement=pm, engine=rag)
    SESSIONS[session.session_id] = SessionState(session=session, paper_info={})
    return CreateSessionResponse(session_id=session.session_id)

@router.post("/session/{session_id}/upload")
def upload(
    session_id: str,
    file: UploadFile = File(...),
):
    state = SESSIONS.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    info_dict = state.session.upload_file(file)
    if not info_dict:
        raise HTTPException(status_code=400, detail="Paper failed to index")
    
    paper_id = str(info_dict["id"])
    title = str(info_dict.get("title", ""))

    state.paper_info[paper_id] = title

    return {"ok": True, "paper_id": paper_id, "title": title}


@router.delete("/session/{session_id}/end")
def end_session(session_id: str):
    state = SESSIONS.get(session_id)

    if not state:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    for paper_id in list(state.paper_info.keys()):
        state.session.remove_file(paper_id)
    
    state.session.end_session()

    SESSIONS.pop(session_id, None)

    return {"ok": True}

@router.post("/session/{session_id}/search", response_model=AskResponse)
def answer(session_id: str, req: AskRequest):
    state = SESSIONS.get(session_id)
    if not state:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    ans = state.session.answer(question=req.question)

    return AskResponse(answer=ans["answer"], sources=ans["sources"])
            
@router.delete("/session/{session_id}/remove/{file_id}")
def remove_file(session_id: str, file_id: str):
    state = SESSIONS.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    if file_id not in state.paper_info:
        raise HTTPException(status_code=404, detail="File not found in this session")

    state.session.remove_file(file_id)
    state.paper_info.pop(file_id, None)

    return {"ok": True, "removed_file_id": file_id}