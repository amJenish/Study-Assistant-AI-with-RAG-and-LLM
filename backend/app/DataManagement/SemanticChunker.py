import re
import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer


class SemanticChunker:
    def __init__(
        self,
        model: SentenceTransformer,
        breakpoint_threshold: float = 0.25,
        min_sentences_per_chunk: int = 3,
        max_chunk_chars: int = 2000,
    ):

        self.model = model
        self.breakpoint_threshold = breakpoint_threshold
        self.min_sentences = min_sentences_per_chunk
        self.max_chunk_chars = max_chunk_chars


    def make_chunk_dictionary(
        self,
        session_id: str,
        paper_id: str,
        title: str,
        pages: List[Dict],
    ) -> List[Dict]:
        # 1. Flatten pages into (sentence, page_number) pairs
        sentence_page_pairs = self._extract_sentences(pages)
        if not sentence_page_pairs:
            return []

        sentences = [s for s, _ in sentence_page_pairs]
        page_nums = [p for _, p in sentence_page_pairs]

        # 2. Embed all sentences in one batched call 
        embeddings = self.model.encode(sentences, batch_size=64, show_progress_bar=False)

        # 3. Find semantic breakpoints
        breakpoints = self._find_breakpoints(embeddings)

        # 4. Build chunks from breakpoints
        raw_chunks = self._build_chunks(sentences, page_nums, breakpoints)

        # 5. Hard-split any chunk that blew past max_chunk_chars
        final_chunks = self._enforce_max_size(raw_chunks)

        # 6. Format into your dictionary schema
        return self._format(final_chunks, session_id, paper_id, title)


    # — sentence extraction

    def _extract_sentences(self, pages: List[Dict]) -> List[tuple]:

        sentence_page_pairs = []
        splitter = re.compile(r'(?<=[.!?])\s+')

        for p in pages:
            if not p.get("text"):
                continue
            page_num = p["page"]

            # Paragraph breaks are always hard boundaries — split before sentences
            paragraphs = [par.strip() for par in p["text"].split("\n\n") if par.strip()]
            for para in paragraphs:
                sentences = [s.strip() for s in splitter.split(para) if s.strip()]
                for sent in sentences:
                    sentence_page_pairs.append((sent, page_num))

        return sentence_page_pairs


    #  find breakpoints via cosine distance drops
    def _find_breakpoints(self, embeddings: np.ndarray) -> List[int]:

        if len(embeddings) < 2:
            return []

        distances = []
        for i in range(len(embeddings) - 1):
            sim = self._cosine_similarity(embeddings[i], embeddings[i + 1])
            distances.append(1 - sim)  # distance = 1 - similarity

        breakpoints = []
        for i, dist in enumerate(distances):
            if dist > self.breakpoint_threshold:
                candidate = i + 1
                last_bp = breakpoints[-1] if breakpoints else 0
                if candidate - last_bp >= self.min_sentences:
                    breakpoints.append(candidate)

        return breakpoints


    def _build_chunks(
        self,
        sentences: List[str],
        page_nums: List[int],
        breakpoints: List[int],
    ) -> List[Dict]:
        boundaries = [0] + breakpoints + [len(sentences)]

        raw_chunks = []
        for i in range(len(boundaries) - 1):
            start = boundaries[i]
            end = boundaries[i + 1]

            chunk_sentences = sentences[start:end]
            chunk_pages = page_nums[start:end]

            raw_chunks.append({
                "text": " ".join(chunk_sentences),
                "page_start": chunk_pages[0],
                "page_end": chunk_pages[-1],
            })

        return raw_chunks


    def _enforce_max_size(self, chunks: List[Dict]) -> List[Dict]:
        result = []
        splitter = re.compile(r'(?<=[.!?])\s+')

        for chunk in chunks:
            if len(chunk["text"]) <= self.max_chunk_chars:
                result.append(chunk)
                continue

            # Re-split into sentences and greedily repack
            sentences = splitter.split(chunk["text"])
            current = []
            current_len = 0

            for sent in sentences:
                if current_len + len(sent) > self.max_chunk_chars and current:
                    result.append({
                        "text": " ".join(current),
                        "page_start": chunk["page_start"],
                        "page_end": chunk["page_end"],
                    })
                    current = []
                    current_len = 0
                current.append(sent)
                current_len += len(sent) + 1

            if current:
                result.append({
                    "text": " ".join(current),
                    "page_start": chunk["page_start"],
                    "page_end": chunk["page_end"],
                })

        return result



    def _format(
        self,
        chunks: List[Dict],
        session_id: str,
        paper_id: str,
        title: str,
    ) -> List[Dict]:
        return [
            {
                "session_id": session_id,
                "paper_id": paper_id,
                "title": title,
                "page_start": chunk["page_start"],
                "page_end": chunk["page_end"],
                "chunk_id": idx + 1,
                "chunk_text": chunk["text"],
            }
            for idx, chunk in enumerate(chunks)
        ]


    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        denom = np.linalg.norm(a) * np.linalg.norm(b)
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)