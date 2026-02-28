export type CreateSessionResponse = {
  session_id: string;
};

export type UploadResponse = {
  ok: boolean;
  paper_id: string;
  title: string;
};

export type AskResponse = {
  answer: string;
  sources: string; // big joint string (not a list)
};

export type RemoveFileResponse = {
  ok: boolean;
  removed_file_id: string;
};

export type EndSessionResponse = {
  ok: boolean;
};

export type Msg = {
  role: "user" | "bot";
  text: string;
  sources?: string;   
};