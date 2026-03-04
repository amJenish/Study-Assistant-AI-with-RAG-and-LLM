from app.services.es_client import get_es_client
from elasticsearch import helpers
from app.debugging.time import timeit
from app.schemas.paper_chunks import PAPER_CHUNKS_MAPPING

class ElasticSystem:

     def __init__(self, index: str = "paper_text"):
          self.es = get_es_client(index)
          self.INDEX = index
          

          if self.es.indices.exists(index=self.INDEX):
               self.es.indices.delete(index=self.INDEX)

          self.es.indices.create(index=self.INDEX, body =
                PAPER_CHUNKS_MAPPING
                )



     @timeit
     def add_content(self, docs: list[dict]):
          actions = (
               {
                    "_op_type": "index", 
                    "_index": self.INDEX,
                    "_id": f"{d['session_id']}_{d['paper_id']}_{d['chunk_id']}", 
                    "_source": d
               }
               for d in docs

          )
          helpers.bulk(
               self.es,
               actions,
               refresh=False,
               request_timeout=120,
               raise_on_error=True
          )


     def remove_session_data(self, session_id: str):

          self.es.delete_by_query(
               index=self.INDEX,
               query={
                    "term": {
                         "session_id": session_id
                    }
               },
               refresh=True
          )

     def remove_paper_data(self, session_id: str, paper_id: str):
               self.es.delete_by_query(
               index=self.INDEX,
               query={
                    "bool": {
                         "filter": [
                              {"term": {"session_id": session_id}},
                              {"term": {"paper_id": paper_id}}
                         ]
                    }
               },
               refresh=True
          )

     def refresh(self):
          self.es.indices.refresh(index=self.INDEX)


     def semantic_search(self, qvec: list[float], k: int, session_id: str, paper_id: str | None = None):
          filters = [{"term": {"session_id": session_id}}]
          
          if paper_id:
               filters.append({"term": {"paper_id": paper_id}})

          knn = {
               "field": "summary_embedding",
               "query_vector": qvec,
               "k": k,
               "num_candidates": max(50, k * 5),
               "filter": {"bool": {"must": filters}}
          }

          body = {
               "knn": knn,
               "_source": ["session_id", "paper_id", "title", "page_start", "page_end", "chunk_text"]
          }

          return self.es.search(index=self.INDEX, body=body)
