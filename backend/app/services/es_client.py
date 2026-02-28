from elasticsearch import Elasticsearch
from app.config import ELASTICSEARCH_URL

def get_es_client() -> Elasticsearch:
    return Elasticsearch(ELASTICSEARCH_URL)