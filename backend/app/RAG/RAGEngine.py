from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.LLMClient import LLMClient
from concurrent.futures import ThreadPoolExecutor

import time

class RAGEngine:

    def __init__(self, retriever: PaperManagement, system, k: int = 20):
        self.retriever = retriever
        self.llm = LLMClient()
        self.system = system
        self.k = k
    
    def _format_sources(self, hits: list[dict]):
        blocks = []

        for i, h in enumerate(hits, start=1):
            src = h["_source"]
            title = src.get("title")
            p1 = src.get("page_start")
            text = " ".join(src["chunk_text"].split())

            blocks.append(f"S{i} Title: {title} | Page: {p1} \n{text}")
        return "\n\n----------\n\n".join(blocks)
    

    def answer(self, question: str, session_id: str, paper_id: str | None = None) -> dict:
        with ThreadPoolExecutor() as executor:
            t0 = time.time()

            hyde_future = executor.submit(
                self.llm.generate,
                    "You are helping locate relevant passages in academic sources. "
                    "Rewrite the following question as a short descriptive passage that captures "
                    "the kind of content a source would contain if it directly addressed this question. "
                    "Focus on the concepts, terms, and relationships that would appear in a relevant excerpt. "
                    "Do not assert facts or claim knowledge - write it as a content fingerprint for search, not an answer. "
                    "Return only the passage, nothing else.",
                question
            )   
            raw_future = executor.submit(self.retriever.semantic_search, question, session_id=session_id, paper_id=paper_id, k=self.k)

            hypothetical_doc = hyde_future.result()
            print(f"HyDE: {time.time() - t0:.2f}s")
            raw_result = raw_future.result()
            print(f"Raw search: {time.time() - t0:.2f}s")

        t1 = time.time()
        hyde_result = self.retriever.semantic_search(hypothetical_doc, session_id=session_id, paper_id=paper_id, k=self.k)
        print(f"HyDE search: {time.time() - t1:.2f}s")

        hits = self._merge_hits(raw_result["hits"]["hits"], hyde_result["hits"]["hits"])
        sources = self._format_sources(hits)

        user = f"Information About: {question}\n\nSources: \n{sources}"

        t2 = time.time()
        answer = self.llm.generate(system=self.system, user=user)
        print(f"Final LLM: {time.time() - t2:.2f}s")

        return {"answer": answer, "sources": sources}
    
    def _merge_hits(self, hits_a, hits_b):
        seen = set()
        merged = []
        for hit in hits_a + hits_b:
            doc_id = hit["_id"]
            if doc_id not in seen:
                seen.add(doc_id)
                merged.append(hit)
        return merged[:self.k]


