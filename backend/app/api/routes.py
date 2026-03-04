from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.api.dependencies import get_paper_mgmt, get_rag_engine
from app.core.ResearchSession import ResearchSession
from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.RAGEngine import RAGEngine
from app.api.schemas import CreateSessionResponse, AskRequest, AskResponse, SessionState
from threading import RLock
from pathlib import Path


router = APIRouter(prefix="/api", tags=["api"])

class SessionManager:
    def __init__(self):
        self._lock = RLock()
        self._sessions: dict[str, SessionState] = {}

    def get(self, session_id: str) -> "SessionState | None":
        with self._lock:
            return self._sessions.get(session_id)

    def create(self, state: "SessionState") -> None:
        with self._lock:
            self._sessions[state.session.session_id] = state

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

SESSIONS = SessionManager()


@router.get("/health")
def health():
    return {"ok": True}

@router.post("/session", response_model=CreateSessionResponse)
def create_session(
    pm: PaperManagement = Depends(get_paper_mgmt),
    rag: RAGEngine = Depends(get_rag_engine),
):
    session = ResearchSession(paperManagement=pm, engine=rag)  # session.session_id created inside
    SESSIONS.create(SessionState(session=session, paper_info={}))
    return CreateSessionResponse(session_id=session.session_id)


@router.post("/session/{session_id}/upload")
async def upload_multiple(session_id: str, files: list[UploadFile] = File(...)):
    state = SESSIONS.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    results = []

    for file in files:
        # Save the file
        saved_path: Path = state.session.save_file_only(file)

        # Ingest the saved file
        info_dict = state.session.ingest_saved_file(saved_path=saved_path)

        # Collect result
        results.append({
            "ok": True,
            "paper_id": info_dict["id"],
            "title": info_dict["title"]
        })

    return {"uploaded": results}


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