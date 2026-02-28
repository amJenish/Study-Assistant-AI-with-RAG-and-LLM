from app.services.llama_client import get_ollama_client
import ollama

class LLMClient:

    def __init__(self, system : str, model_name: str = "qwen2.5:7b-instruct"):
        self.model_name = model_name
        self.system = system

        self.client = get_ollama_client()

    def generate(self, user: str) -> str:
        response = self.client.chat(
            model=self.model_name,
            messages=[
                {"role": "system", "content": self.system},
                {"role": "user", "content": user}
            ],
        )

        return response["message"]["content"]