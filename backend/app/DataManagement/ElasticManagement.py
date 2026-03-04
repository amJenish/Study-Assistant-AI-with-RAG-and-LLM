from app.DataManagement.ElasticSystem import ElasticSystem
from pypdf import PdfReader
from app.schemas.paper_chunks import PAPER_CHUNKS_MAPPING
from pathlib import Path
from typing import List, Dict
import re
from sentence_transformers import SentenceTransformer
from uuid import uuid4
import torch
import gc
from app.DataManagement.SemanticChunker import SemanticChunker


class PaperManagement:

    def __init__(self):
        self.elastic = ElasticSystem()
        self.transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
        

    def add_paper(self, session_id: str, path: str,
        chunk_size=1200, overlap_size=80,
        embed_batch_size=128, index_batch_size=256):

        chunker = SemanticChunker(self.transformer_model)


        reader = PdfReader(path)
        title = self._extract_title(reader, path)
        pages = self._extract_page_texts(reader)

        paper_id = str(uuid4())
        buf_docs, buf_texts = [], []

        for doc in chunker.make_chunk_dictionary(session_id=session_id, paper_id=paper_id, title=title, pages=pages):
            buf_docs.append(doc)
            buf_texts.append(doc["chunk_text"])

            if len(buf_docs) >= index_batch_size:
                embs = self.transformer_model.encode(
                    buf_texts,
                    batch_size=embed_batch_size,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                for d, e in zip(buf_docs, embs):
                    d["embedding"] = e.tolist()

                self.elastic.add_content(buf_docs)
                buf_docs.clear(); buf_texts.clear()

        if buf_docs:
            embs = self.transformer_model.encode(
                buf_texts,
                batch_size=embed_batch_size,
                normalize_embeddings=True,
                show_progress_bar=False
            )
            for d, e in zip(buf_docs, embs):
                d["embedding"] = e.tolist()
            self.elastic.add_content(buf_docs)
            
        self.elastic.refresh()
        return {"id": paper_id, "title": title}
    
    def release_embedder(self):
        if self.transformer_model is None:
            return

        try:
            self.transformer_model.to("cpu")
        except Exception:
            raise Exception("FAILED TO MOVE TRANSFORMER MODEL TO CPU!")

        gc.collect()

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def semantic_search(self, query: str, k: int, session_id: str, paper_id: None | str = None):
        vec = self.transformer_model.encode(query, normalize_embeddings=True).tolist() #embed the query and convert it to a list 
        return self.elastic.semantic_search( qvec=vec, session_id=session_id, paper_id=paper_id, k=k)
    

    def get_elastic(self):
        return self.elastic
    
        
    def delete_session(self, session_id: str):
        self.elastic.remove_session_data(session_id=session_id)
    
    def delete_paper_from_session(self, session_id: str, paper_id: str):
        self.elastic.remove_paper_data(session_id=session_id, paper_id=paper_id)
    

    #Private functions -------------------------------------


    
    def _extract_page_texts(self, reader) -> List[Dict]:
        pages = []
        for i, page in enumerate(reader.pages, start=1):
            txt = page.extract_text() or ""
            # normalize whitespace
            txt = re.sub(r"[ \t]+", " ", txt)
            txt = re.sub(r"\n{3,}", "\n\n", txt).strip()
            pages.append({"page": i, "text": txt})
        return pages



    def _extract_title(self, reader, filepath):
        #First try to extract title from meta data-----
        if reader.metadata and reader.metadata.title:
            return reader.metadata.title
        
        #Else extract the first line found as the title---
        first_page = reader.pages[0].extract_text()
        if first_page:
            return first_page.split("\n")[0]
        
        #Fallback: get the file name -----
        return Path(filepath).stem
    
