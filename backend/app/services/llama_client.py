import ollama
from app.config import OLLAMA_URL

def get_ollama_client():
    return ollama.Client(host=OLLAMA_URL)