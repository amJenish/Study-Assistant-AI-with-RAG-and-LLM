from app.DataManagement.ElasticSystem import ElasticSystem
from pypdf import PdfReader
from pathlib import Path
from typing import List, Dict
import re
from sentence_transformers import SentenceTransformer
from uuid import uuid4
import torch
import gc
from app.DataManagement.SemanticChunker import SemanticChunker
from app.RAG.LLMClient import LLMClient
from concurrent.futures import ThreadPoolExecutor

class PaperManagement:

    def __init__(self, llm: LLMClient):
        self.elastic = ElasticSystem()
        self.transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.llm = llm

    def add_paper(self, session_id: str, path: str,
        chunk_size=1200, overlap_size=80,
        embed_batch_size=128, index_batch_size=256):

        chunker = SemanticChunker(self.transformer_model)

        reader = PdfReader(path)
        title = self._extract_title(reader, path)
        pages = self._extract_page_texts(reader)

        paper_id = str(uuid4())
        buf_docs, buf_texts = [], []

        # Collect all chunks first
        all_docs = list(chunker.make_chunk_dictionary(
            session_id=session_id, paper_id=paper_id, title=title, pages=pages
        ))

        # Generate all summaries in parallel
        with ThreadPoolExecutor() as executor:
            summary_futures = [
                executor.submit(
                    self.llm.generate,
                    system=(
                        "You are helping index passages from academic sources for a tutoring search system. "
                        "Rewrite the following passage as a short descriptive fingerprint that captures "
                        "the explanations, definitions, examples, and relationships it contains. "
                        "Write it as if describing what a student would find in this passage and what concept it could help them understand. "
                        "Focus on the teaching value of the passage — the mechanisms, foundational ideas, and context it provides. "
                        "Do not assert conclusions or add outside knowledge — only reflect what is in the passage. "
                        "Return only the fingerprint, nothing else."
                    ),
                    user=doc["chunk_text"]
                )
                for doc in all_docs
            ]
            summaries = [f.result() for f in summary_futures]

        # Attach summaries and batch index
        for doc, summary in zip(all_docs, summaries):
            doc["summary"] = summary
            buf_docs.append(doc)
            buf_texts.append(doc["chunk_text"])

            if len(buf_docs) >= index_batch_size:
                self._embed_and_index(buf_docs, buf_texts, embed_batch_size)
                buf_docs.clear(); buf_texts.clear()

        if buf_docs:
            self._embed_and_index(buf_docs, buf_texts, embed_batch_size)

        self.elastic.refresh()
        return {"id": paper_id, "title": title}


    def _embed_and_index(self, buf_docs, buf_texts, embed_batch_size):
        summaries = [d["summary"] for d in buf_docs]

        with ThreadPoolExecutor() as executor:
            text_future = executor.submit(
                self.transformer_model.encode, buf_texts,
                batch_size=embed_batch_size, normalize_embeddings=True, show_progress_bar=False
            )
            summary_future = executor.submit(
                self.transformer_model.encode, summaries,
                batch_size=embed_batch_size, normalize_embeddings=True, show_progress_bar=False
            )
            text_embs = text_future.result()
            summary_embs = summary_future.result()

        for d, te, se in zip(buf_docs, text_embs, summary_embs):
            d["embedding"] = te.tolist()
            d["summary_embedding"] = se.tolist()

        self.elastic.add_content(buf_docs)
    
    
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
    
