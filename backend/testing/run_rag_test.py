from app.DataManagement.ElasticManagement import PaperManagement
from app.RAG.RAGEngine import RAGEngine
from app.config import BASE_STORAGE_DIR
from app.prompts import RESEARCH_PROMPT
def run_rag_sanity():

    # Initialize real components
    retriever = PaperManagement()

    engine = RAGEngine(
        retriever=retriever,
        system=RESEARCH_PROMPT,
        k=5,
    )

    # ---- CHANGE THESE ----
    session_id = "test-session"
    paper_info = retriever.add_paper(session_id=session_id, path='testing\\1-s2.0-S0165032725004999-main.pdf', )


    question = "Summarize what this paper says about loneliness and suicide."

    print("\nRunning RAGEngine sanity test...\n")

    result = engine.answer(
        question=question,
        session_id=session_id,
        paper_id=paper_info['id'],
    )

    print("\n========== ANSWER ==========\n")
    print(result["answer"])

    print("\n========== SOURCES ==========\n")
    print(result["sources"])



run_rag_sanity()