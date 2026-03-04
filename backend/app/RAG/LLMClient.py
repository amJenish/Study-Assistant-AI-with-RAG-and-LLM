from app.services.llama_client import get_ollama_client


class LLMClient:

    def __init__(self, model_name: str = "qwen2.5:3b-instruct"):
        self.model_name = model_name
        self.client = get_ollama_client()

    def generate(self, system:str, user: str) -> str:
        response = self.client.chat(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
        )

        return response["message"]["content"]