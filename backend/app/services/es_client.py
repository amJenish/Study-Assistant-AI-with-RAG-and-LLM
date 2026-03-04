from elasticsearch import Elasticsearch
from app.config import ELASTICSEARCH_URL
from app.schemas.paper_chunks import PAPER_CHUNKS_MAPPING

def get_es_client(index : str) -> Elasticsearch:
    es = Elasticsearch(ELASTICSEARCH_URL)

    if not es.indices.exists(index=index):
        es.indices.create(
        index=index,
        body=PAPER_CHUNKS_MAPPING
        )

    return es
