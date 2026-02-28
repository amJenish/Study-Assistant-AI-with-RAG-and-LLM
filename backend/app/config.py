import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

ELASTICSEARCH_HOST = os.getenv("ELASTICSEARCH_HOST")
ELASTICSEARCH_PORT = os.getenv("ELASTICSEARCH_PORT")

ELASTICSEARCH_URL = f"{ELASTICSEARCH_HOST}:{ELASTICSEARCH_PORT}"

OLLAMA_HOST = os.getenv("OLLAMA_HOST")
OLLAMA_PORT = os.getenv("OLLAMA_PORT")

OLLAMA_URL = f"{OLLAMA_HOST}:{OLLAMA_PORT}"

BASE_STORAGE_DIR = Path(str(os.getenv("base_file_dir")))