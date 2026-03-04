from app.config import BASE_STORAGE_DIR
from app.DataManagement.ElasticManagement import PaperManagement
from uuid import uuid4
from fastapi import UploadFile
from pathlib import Path
import shutil
from app.RAG.RAGEngine import RAGEngine
import os
from app.debugging.time import timeit


class ResearchSession:

    def __init__(self, paperManagement : PaperManagement, engine : RAGEngine):
        self.session_id = str(uuid4())
        self._dir_path = BASE_STORAGE_DIR  / self.session_id
        self._dir_path.mkdir(parents=True, exist_ok=False)

        self.paperManagement = paperManagement
        self.engine = engine
        self._COPY_BUF = 1024 * 1024

    @timeit
    def answer(self, question):
        ans =  self.engine.answer(question=question, session_id=self.session_id)
        return ans
    
    @timeit
    def save_file_only(self, file: UploadFile) -> Path:

        filename = os.path.basename(file.filename) 
        saved_path = self._dir_path / filename

        with open(saved_path, "wb", buffering=self._COPY_BUF) as out_f:
            shutil.copyfileobj(file.file, out_f, length=self._COPY_BUF)

        return saved_path

    @timeit
    def ingest_saved_file(self, saved_path: Path):
        return self.paperManagement.add_paper(session_id=self.session_id, path=str(saved_path))

    
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