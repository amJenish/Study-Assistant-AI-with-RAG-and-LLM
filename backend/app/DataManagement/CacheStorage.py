from collections import deque


class CacheStorage:

    def __init__(self, cache_size: int):
        self.q = deque(maxlen=cache_size)
    
    def add_cache(self, data : str):
        self.q.append(data)
    
    def get_cache(self):
        return list(self.q)
    
    def __len__(self):
        return len(self.q)
