from groq import Groq, RateLimitError
from app.config import GROQ_API, GROQ_API2, GROQ_API3, GROQ_API4
import time

class LLMClient:

    def __init__(self, model_name: str = "llama-3.1-8b-instant"):
        self._api_flipper = 0
        self.model_name = model_name
        self.client = Groq(api_key=GROQ_API)

    def generate(self, system: str, user: str, retries: int = 4) -> str:
        for attempt in range(retries):
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
                print("flipped and retrying...")
                self._flip_api()  # flip first, then wait and retry
                if attempt < retries - 1:
                    time.sleep(2 ** (attempt/2))
                else:
                    raise e
    
    def _flip_api(self):
        self._api_flipper += 1
        if self._api_flipper % 4 == 0:
            self.client = Groq(api_key=GROQ_API)
        elif self._api_flipper % 4 == 1:
            self.client = Groq(api_key=GROQ_API2)
        elif self._api_flipper % 4 == 2:
            self.client = Groq(api_key=GROQ_API3)
        elif self._api_flipper % 4 == 1:
            self.client = Groq(api_key=GROQ_API4)