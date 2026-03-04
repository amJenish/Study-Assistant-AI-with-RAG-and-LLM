import type {
  AskResponse,
  CreateSessionResponse,
  EndSessionResponse,
  RemoveFileResponse,
  UploadResponse,
} from "./apiTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function createSession(): Promise<CreateSessionResponse> {
  const res = await fetch(`${API_BASE}/api/session`, { method: "POST" });
  return readJson<CreateSessionResponse>(res);
}

export async function uploadToSession(
  sessionId: string,
  file: File
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/session/${sessionId}/upload`, {
    method: "POST",
    body: form,
  });

  return readJson<UploadResponse>(res);
}

export async function askSession(
  sessionId: string,
  question: string
): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  return readJson<AskResponse>(res);
}

export async function removeFile(
  sessionId: string,
  fileId: string
): Promise<RemoveFileResponse> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/remove/${fileId}`, {
    method: "DELETE",
  });

  return readJson<RemoveFileResponse>(res);
}

export async function endSession(sessionId: string): Promise<EndSessionResponse> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/end`, {
    method: "DELETE",
  });

  return readJson<EndSessionResponse>(res);
}