export type Session = {
  id: string;
  name: string;
  createdAt: number;
};

export type Paper = {
  paper_id: string;
  title: string;
};

export type Msg = {
  role: "user" | "bot";
  text: string;
  sources?: string; // only for bot messages
};