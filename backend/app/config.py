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
GROQ_API5=os.getenv("GROQ_API5")
GROQ_API6=os.getenv("GROQ_API6")
GROQ_API7=os.getenv("GROQ_API7")
GROQ_API8=os.getenv("GROQ_API8")
GROQ_API9=os.getenv("GROQ_API9")
GROQ_API10=os.getenv("GROQ_API10")

OLLAMA_HOST = os.getenv("OLLAMA_HOST")
OLLAMA_PORT = os.getenv("OLLAMA_PORT")

OLLAMA_URL = f"{OLLAMA_HOST}:{OLLAMA_PORT}"

BASE_STORAGE_DIR = Path(str(os.getenv("base_file_dir")))