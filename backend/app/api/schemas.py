from pydantic import BaseModel
from dataclasses import dataclass, field
from app.core.ResearchSession import ResearchSession

@dataclass
class SessionState:
    session: ResearchSession
    paper_info: dict[str,str]

SESSIONS: dict[str, SessionState] = {}

class CreateSessionResponse(BaseModel):
    session_id: str

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: str

