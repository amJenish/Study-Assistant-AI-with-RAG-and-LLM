from unittest.mock import MagicMock
import pytest

from app.core.ResearchSession import ResearchSession


@pytest.fixture
def pm_mock():
    return MagicMock()


@pytest.fixture
def engine_mock():
    engine = MagicMock()

    # IMPORTANT: simulate real RAG output contract
    engine.answer.return_value = {
        "answer": "Example answer",
        "sources": "S1 Title: Paper\nSome chunk text"
    }

    return engine


def test_answer_returns_sources(pm_mock, engine_mock):
    session = ResearchSession(
        paperManagement=pm_mock,
        engine=engine_mock
    )

    result = session.answer("What is loneliness?")

    # ---- SANITY CONTRACT ----
    assert isinstance(result, dict)
    assert "answer" in result
    assert "sources" in result

    assert isinstance(result["sources"], str)
    assert len(result["sources"]) > 0