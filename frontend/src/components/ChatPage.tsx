"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  Elevation,
  Intent,
  ProgressBar,
  Icon,
  H5,
  Text,

  Spinner,
  SpinnerSize,
} from "@blueprintjs/core";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

type Paper = {
  paper_id: string;
  title: string;
};

type Message = {
  sender: "user" | "bot";
  text: string;
  sources?: string;
};

type ChatPageProps = {
  sessionId: string;
  uploadedPapers: Paper[];
};

export default function ChatPage({ sessionId, uploadedPapers }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fakeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startFakeProgress = () => {
    setFakeProgress(0);
    const interval = 300;
    let current = 0;
    const steps = 60; //

    fakeTimerRef.current = setInterval(() => {
      current += 1;
      const raw = current / steps;
      const eased = 1 - Math.pow(1 - raw, 2.5);
      const capped = Math.min(eased * 88, 88);
      setFakeProgress(capped);
      if (current >= steps) clearInterval(fakeTimerRef.current!);
    }, interval);
  };

  const completeFakeProgress = () => {
    if (fakeTimerRef.current) clearInterval(fakeTimerRef.current);
    setFakeProgress(100);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    startFakeProgress();

    try {
      const res = await fetch(`http://localhost:8000/api/session/${sessionId}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      completeFakeProgress();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.answer, sources: data.sources },
        ]);
        setLoading(false);
        setFakeProgress(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 400);
    } catch (err) {
      console.error(err);
      completeFakeProgress();
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Error: could not fetch answer." },
        ]);
        setLoading(false);
        setFakeProgress(0);
      }, 400);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#111827",
        fontFamily: "'IBM Plex Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Left Panel: Papers*/}
      <div
        style={{
          width: "260px",
          flexShrink: 0,
          background: "#1c2333",
          borderRight: "1px solid #2d3f55",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Icon icon="book" size={16} color="#4C90F0" />
          <Text
            style={{
              color: "#8A9BA8",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Uploaded Files
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {uploadedPapers.map((paper, i) => (
            <Card
              key={paper.paper_id}
              elevation={Elevation.ONE}
              style={{
                background: "#253047",
                borderRadius: "8px",
                padding: "10px 12px",
                cursor: "default",
                border: "1px solid #2d3f55",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <Icon icon="document" size={12} color="#4C90F0" style={{ marginTop: "2px", flexShrink: 0 }} />
                <Text style={{ color: "#e4e4e4", fontSize: "12px", lineHeight: "1.5" }}>
                  {paper.title}
                </Text>
              </div>
            </Card>
          ))}
        </div>

      </div>

      {/* ── Right Panel: Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #2d3f55",
            background: "#1c2333",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Icon icon="chat" size={16} color="#4C90F0" />
          <H5 style={{ color: "#F5F8FA", margin: 0 }}>Study Assistant</H5>
        </div>

        {/* Loading bar  */}
        <div style={{ height: "3px", background: "#1c2333" }}>
          {loading && (
            <ProgressBar
              value={fakeProgress / 100}
              intent={Intent.PRIMARY}
              animate={fakeProgress < 100}
              stripes={fakeProgress < 100}
              style={{ height: "3px", borderRadius: 0, margin: 0 }}
            />
          )}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                opacity: 0.4,
                paddingTop: "80px",
              }}
            >
              <Icon icon="search-around" size={40} color="#5C7080" />
              <Text style={{ color: "#5C7080", fontSize: "14px" }}>
                Ask a question about your papers
              </Text>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                gap: "6px",
              }}
            >
              {/* Label */}
              <Text
                style={{
                  color: "#5C7080",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  paddingLeft: msg.sender === "user" ? 0 : "4px",
                  paddingRight: msg.sender === "user" ? "4px" : 0,
                }}
              >
                {msg.sender === "user" ? "You" : "Assistant"}
              </Text>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "72%",
                  padding: "12px 16px",
                  borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.sender === "user" ? "#1e3a5f" : "#1c2333",
                  border: `1px solid ${msg.sender === "user" ? "#2d5a8e" : "#2d3f55"}`,
                  color: "#e4e4e4",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {msg.sender === "user" ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ color: "#F5F8FA", fontWeight: 600 }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "#A9C0D4" }}>{children}</em>,
                      ul: ({ children }) => <ul style={{ margin: "4px 0 8px", paddingLeft: "20px" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "4px 0 8px", paddingLeft: "20px" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: "4px", color: "#e4e4e4" }}>{children}</li>,
                      h1: ({ children }) => <h1 style={{ color: "#F5F8FA", fontSize: "16px", fontWeight: 700, margin: "8px 0 6px" }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ color: "#F5F8FA", fontSize: "15px", fontWeight: 700, margin: "8px 0 6px" }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ color: "#F5F8FA", fontSize: "14px", fontWeight: 700, margin: "8px 0 4px" }}>{children}</h3>,
                      code: (({ inline, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) =>
                        inline ? (
                          <code style={{ background: "#0f1923", color: "#8ABBFF", padding: "1px 5px", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }}>{children}</code>
                        ) : (
                          <div> </div>
                        )
                      ) as Components["code"],
                      blockquote: ({ children }) => (
                        <blockquote style={{ borderLeft: "3px solid #4C90F0", margin: "8px 0", paddingLeft: "12px", color: "#8A9BA8" }}>{children}</blockquote>
                      ),
                      hr: () => <hr style={{ border: "none", borderTop: "1px solid #2d3f55", margin: "10px 0" }} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>

              {/* Sources toggle */}
              {msg.sender === "bot" && msg.sources && (
                <div style={{ paddingLeft: "4px" }}>
                  <Button
                    minimal
                    small
                    intent={Intent.PRIMARY}
                    icon={expandedSources === idx ? "chevron-up" : "chevron-down"}
                    text={expandedSources === idx ? "Hide sources" : "View sources"}
                    onClick={() => setExpandedSources(expandedSources === idx ? null : idx)}
                    style={{ fontSize: "12px" }}
                  />

                  {expandedSources === idx && (
                    <Card
                      elevation={Elevation.ONE}
                      style={{
                        marginTop: "8px",
                        background: "#192130",
                        border: "1px solid #2d3f55",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        maxWidth: "600px",
                      }}
                    >
                      <Text style={{ color: "#8A9BA8", fontSize: "12px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {msg.sources}
                      </Text>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "#1c2333",
                  border: "1px solid #2d3f55",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Spinner size={SpinnerSize.SMALL} intent={Intent.PRIMARY} />
                <Text style={{ color: "#5C7080", fontSize: "13px" }}>Searching...</Text>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #2d3f55",
            background: "#1c2333",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={loading ? "Waiting for response..." : "Ask something about your papers..."}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSend();
              }}
              style={{
                width: "100%",
                background: loading ? "#161e2d" : "#253047",
                border: `1px solid ${loading ? "#1e2d42" : "#3d5573"}`,
                borderRadius: "8px",
                padding: "10px 14px",
                color: loading ? "#4a5c72" : "#e4e4e4",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
                cursor: loading ? "not-allowed" : "text",
              }}
              onFocus={(e) => {
                if (!loading) e.target.style.borderColor = "#4C90F0";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = loading ? "#1e2d42" : "#3d5573";
              }}
            />
          </div>

          <Button
            large
            intent={Intent.PRIMARY}
            icon="send-message"
            disabled={loading || !input.trim()}
            onClick={handleSend}
            style={{
              borderRadius: "8px",
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}