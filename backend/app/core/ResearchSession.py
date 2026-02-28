from app.config import BASE_STORAGE_DIR
from app.DataManagement.ElasticManagement import PaperManagement
from uuid import uuid4
from fastapi import UploadFile
from pathlib import Path
import shutil
from app.RAG.RAGEngine import RAGEngine

class ResearchSession:

    def __init__(self, paperManagement : PaperManagement, engine : RAGEngine):
        self.session_id = str(uuid4())
        self._dir_path = BASE_STORAGE_DIR  / self.session_id
        self._dir_path.mkdir(parents=True, exist_ok=False)

        self.paperManagement = paperManagement
        self.engine = engine

    
    def answer(self, question):
        return self.engine.answer(question=question, session_id=self.session_id)
    

    def upload_file(self, file: UploadFile):
        filename = Path(file.filename).name

        saved_path = self._dir_path / filename

        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return self.paperManagement.add_paper(session_id=self.session_id, path=saved_path)

    
    def remove_file(self, paper_id: str):
        self.paperManagement.delete_paper_from_session(session_id=self.session_id, paper_id=paper_id)


    def end_session(self) -> bool:
        base = BASE_STORAGE_DIR.resolve()
        target = self._dir_path.resolve()

        if base not in target.parents:
            raise ValueError("Invalid folder path.")

        if not target.exists():
            return False

        shutil.rmtree(target)

        self.paperManagement.delete_session(self.session_id)