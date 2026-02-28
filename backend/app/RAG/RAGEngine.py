from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.LLMClient import LLMClient

class RAGEngine:

    def __init__(self, retriever: PaperManagement, system, k: int = 20):
        self.retriever = retriever
        self.llm = LLMClient(system=system)
        self.k = k
    
    def _format_sources(self, hits: list[dict]):
        blocks = []

        for i, h in enumerate(hits, start=1):
            src = h["_source"]
            title = src.get("title")
            chunk_id = src.get("chunk_id")
            p1 = src.get("page_start")
            p2 = src.get("page_end")
            text = src["chunk_text"].strip()

            pages = f"{p1}-{p2}" if p1 and p2 else "N/A"

            blocks.append(f"S{i} Title: {title} | Pages: {pages} \n{text}")
        return "\n\n----------\n\n".join(blocks)
    
    def answer(self, question: str, session_id: str, paper_id: str | None=None) -> dict:

        result = self.retriever.semantic_search(question, session_id=session_id, paper_id=paper_id, k=self.k)
        hits = result["hits"]["hits"]

        sources = self._format_sources(hits)


        user = f"Question: {question}\n\nSources: \n{sources}"

        answer = self.llm.generate(user=user)

        return {"answer": answer, "sources": sources}


