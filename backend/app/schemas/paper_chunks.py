PAPER_CHUNKS_MAPPING = {
    "mappings": {
        "properties": {
            "session_id": {"type": "keyword"},
            "paper_id": {"type": "keyword"},
            "title": {"type": "text"},
            "chunk_id": {"type": "integer"},
            "chunk_text": {"type": "text"},
            "page_start": {"type": "integer"},
            "page_end": {"type": "integer"},
            "embedding": {"type": "dense_vector", 
                          "dims": 384}
        }
    }
}
