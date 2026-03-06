from groq import Groq, RateLimitError
from app.config import GROQ_API, GROQ_API2, GROQ_API3, GROQ_API4, GROQ_API5, GROQ_API6, GROQ_API7, GROQ_API8
import time

class LLMClient:

    def __init__(self, model_name: str = "llama-3.1-8b-instant"):
        self._apis = [GROQ_API, GROQ_API2, GROQ_API3, GROQ_API4, GROQ_API5, GROQ_API6, GROQ_API7, GROQ_API8]
        self._api_index = 0
        self.model_name = model_name
        self.client = Groq(api_key=GROQ_API)

    def generate(self, system: str, user: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
            )
            return response.choices[0].message.content
        except RateLimitError as e:
            if self._api_index == (len(self._apis)-1):
               time.sleep(10)
            print("flipped and retrying...")
            self._flip_api()  
            print(f"Switched to API on Index: {self._api_index+1}")

    def _flip_api(self):
        self._api_index = (self._api_index + 1) % len(self._apis)
        self.client = Groq(api_key=self._apis[self._api_index])