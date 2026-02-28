from app.services.es_client import get_es_client


class ElasticSystem:

     def __init__(self):
        self.es = get_es_client()
        self.INDEX = "papers_text" #index name


     def setup_index(self, mapping: dict):
        if not self.es.indices.exists(index=self.INDEX):
            self.es.indices.create(
                index=self.INDEX,
                body=mapping
            )

     def add_content(self, d: dict):
         self.es.index(index=self.INDEX, id=f"{d['session_id']}_{d['paper_id']}_{d['chunk_id']}", body=d)


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
               "field": "embedding",
               "query_vector": qvec,
               "k": k,
               "num_candidates": max(50, k * 10),
               "filter": {"bool": {"must": filters}},  # ← actually applied now
          }

          body = {
               "knn": knn,
               "_source": ["session_id", "paper_id", "title", "page_start", "page_end", "chunk_id", "chunk_text"]
          }

          return self.es.search(index=self.INDEX, body=body)
