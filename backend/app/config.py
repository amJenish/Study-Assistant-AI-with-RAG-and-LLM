import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

ELASTICSEARCH_HOST = os.getenv("ELASTICSEARCH_HOST")
ELASTICSEARCH_PORT = os.getenv("ELASTICSEARCH_PORT")

ELASTICSEARCH_URL = f"{ELASTICSEARCH_HOST}:{ELASTICSEARCH_PORT}"

#GROQ APIs ----------------------------
GROQ_API=os.getenv("GROQ_API")
GROQ_API2=os.getenv("GROQ_API2")
GROQ_API3=os.getenv("GROQ_API3")
GROQ_API4=os.getenv("GROQ_API4")

OLLAMA_HOST = os.getenv("OLLAMA_HOST")
OLLAMA_PORT = os.getenv("OLLAMA_PORT")

OLLAMA_URL = f"{OLLAMA_HOST}:{OLLAMA_PORT}"

BASE_STORAGE_DIR = Path(str(os.getenv("base_file_dir")))