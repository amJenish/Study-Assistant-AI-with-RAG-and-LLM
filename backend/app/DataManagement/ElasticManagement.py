from app.DataManagement.ElasticSystem import ElasticSystem
from pypdf import PdfReader
from app.schemas.paper_chunks import PAPER_CHUNKS_MAPPING
from pathlib import Path
from typing import List, Dict
import re
from sentence_transformers import SentenceTransformer
from uuid import uuid4


class PaperManagement:

    def __init__(self):
        self.elastic = ElasticSystem()
        self.elastic.setup_index(PAPER_CHUNKS_MAPPING)
        self.transformer_model = SentenceTransformer("all-MiniLM-L6-v2")

    def add_paper(self, session_id: str, path: str, chunk_size=800, overlap_size=100):
        reader = PdfReader(path)
        title = self._extract_title(reader, path)

        pages = self._extract_page_texts(reader)
        paper_id = str(uuid4())
        all_chunks = self._make_chunk_dictionary(session_id=session_id, paper_id=paper_id, title=title, pages=pages, chunk_size=chunk_size, overlap=overlap_size)


        texts = [d["chunk_text"] for d in all_chunks]

        embeddings = self.transformer_model.encode(
            texts,
            normalize_embeddings=True
        )
        for d,emb in zip(all_chunks, embeddings):
            d["embedding"] = emb.tolist()
            self.elastic.add_content(d)
        self.elastic.refresh()

        return {"id": paper_id, "title": title}

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


    def _make_chunk_dictionary(self,
        session_id,
        paper_id,
        title,
        pages: List[Dict],
        chunk_size: int = 800,
        overlap: int = 100
    ) -> List[Dict]:
        assert 0 <= overlap < chunk_size

        chunks = []
        chunk_id = 0

        current = ""
        page_start = None
        page_end = None

        def add_chunk(text: str, page_start, page_end):
            nonlocal chunk_id
            nonlocal paper_id
            nonlocal title
            nonlocal session_id

            chunk_id += 1
            chunks.append({
                "session_id": session_id,
                "paper_id": paper_id,
                "title": title,
                "page_start": page_start,
                "page_end": page_end,
                "chunk_id": chunk_id,
                "chunk_text": text.strip()
            })
        
        for p in pages:
            if not p["text"]:
                continue

            if page_start is None:
                page_start = p["page"]
            page_end = p["page"]

            # split into paragraph-like units
            parts = [s.strip() for s in p["text"].split("\n\n") if s.strip()]

            for part in parts:
                # if one paragraph is huge, hard-split it
                if len(part) > chunk_size:
                    # flush current first
                    if current.strip():
                        add_chunk(current, page_start=page_start, page_end=page_end)
                        current = current[-overlap:] if overlap else ""
                        page_start = p["page"]

                    start = 0
                    while start < len(part):
                        piece = part[start:start + chunk_size]
                        add_chunk(piece, page_start=page_start, page_end=page_end)
                        start += chunk_size - overlap
                    current = ""
                    continue

                # normal greedy packing
                if len(current) + len(part) + 2 <= chunk_size:
                    current = (current + "\n\n" + part) if current else part
                else:
                    # emit current chunk
                    if current.strip():
                        add_chunk(current, page_start=page_start, page_end=page_end)

                    # carry overlap tail into next chunk
                    tail = current[-overlap:] if overlap else ""
                    current = (tail + "\n\n" + part).strip()

                    # new chunk starts around here (approx)
                    page_start = p["page"]
                    page_end = p["page"]

        if current.strip():
            add_chunk(current, page_start=page_start, page_end=page_end)

        return chunks



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