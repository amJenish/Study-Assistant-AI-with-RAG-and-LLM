# test_research_session.py
import io
import os
import shutil
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from starlette.datastructures import UploadFile as StarletteUploadFile


from app.core.ResearchSession import ResearchSession


@pytest.fixture
def tmp_storage(monkeypatch, tmp_path):

    import app.core.ResearchSession as research_session_module  

    monkeypatch.setattr(research_session_module, "BASE_STORAGE_DIR", tmp_path)
    return tmp_path


@pytest.fixture
def pm_mock():
    pm = MagicMock()
    pm.add_paper.return_value = True
    return pm


@pytest.fixture
def engine_mock():
    engine = MagicMock()
    return engine


@pytest.fixture(autouse=True)
def patch_unique_id_alias():

    if not hasattr(ResearchSession, "unique_id"):
        ResearchSession.unique_id = property(lambda self: self.session_id)


def make_upload_file(filename: str, content: bytes) -> StarletteUploadFile:
    fileobj = io.BytesIO(content)
    return StarletteUploadFile(filename=filename, file=fileobj)


def test_init_creates_session_dir(tmp_storage, pm_mock, engine_mock):
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)

    assert session.session_id is not None
    assert isinstance(session.session_id, str)


    expected_dir = tmp_storage / session.session_id
    assert expected_dir.exists()
    assert expected_dir.is_dir()


def test_answer_calls_engine_with_session_id(tmp_storage, pm_mock, engine_mock):
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)

    session.answer("hello?")
    engine_mock.answer.assert_called_once()
    _, kwargs = engine_mock.answer.call_args
    assert kwargs["question"] == "hello?"
    assert kwargs["session_id"] == session.session_id


def test_upload_file_saves_and_indexes(tmp_storage, pm_mock, engine_mock):
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)

    upload = make_upload_file("test.pdf", b"%PDF-1.4 fake pdf bytes")
    saved_path = session.upload_file(upload)

    assert saved_path is not None
    assert saved_path.exists()
    assert saved_path.read_bytes() == b"%PDF-1.4 fake pdf bytes"

    pm_mock.add_paper.assert_called_once()
    called_path = pm_mock.add_paper.call_args.args[0]
    assert Path(called_path) == saved_path


def test_upload_file_returns_none_if_add_paper_fails(tmp_storage, pm_mock, engine_mock):
    pm_mock.add_paper.return_value = False
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)

    upload = make_upload_file("fail.pdf", b"data")
    out = session.upload_file(upload)

    # Your method returns saved_path only if add_paper is truthy; otherwise returns None
    assert out is None

    # File is still written before add_paper is checked
    expected = (tmp_storage / session.unique_id / "fail.pdf")
    assert expected.exists()


def test_remove_file_calls_paper_management(tmp_storage, pm_mock, engine_mock):
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)

    session.remove_file("paper123")
    pm_mock.delete_paper_from_session.assert_called_once_with(
        session_id=session.session_id,
        paper_id="paper123",
    )


def test_end_session_deletes_dir_and_calls_delete_session(tmp_storage, pm_mock, engine_mock):
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)
    session_dir = tmp_storage / session.unique_id
    assert session_dir.exists()

    # Put a file inside so rmtree actually does something
    (session_dir / "x.txt").write_text("hi")

    out = session.end_session()

    assert not session_dir.exists()
    pm_mock.delete_session.assert_called_once_with(session.session_id)


def test_end_session_returns_false_if_dir_missing(tmp_storage, pm_mock, engine_mock):
    session = ResearchSession(paperManagement=pm_mock, engine=engine_mock)
    session_dir = tmp_storage / session.unique_id

    shutil.rmtree(session_dir)
    assert not session_dir.exists()

    out = session.end_session()
    assert out is False
    pm_mock.delete_session.assert_not_called()