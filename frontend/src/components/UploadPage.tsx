"use client";
import React, { useState, useRef, useCallback } from "react";
import ChatPage from "./ChatPage";
import {
  Button,
  Card,
  Elevation,
  Tag,
  Intent,
  ProgressBar,
  Callout,
  Icon,
  H2,
  H5,
  Text,
  Divider,
} from "@blueprintjs/core";

interface UploadedPaper {
  paper_id: string;
  title: string;
}

type Stage = "idle" | "uploading" | "processing" | "done";

// Estimate processing time based on total file size
function estimateDuration(files: File[]): number {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  return Math.max(8000, (totalBytes / 100_000) * 1000); // min 8s
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [fakeProgress, setFakeProgress] = useState(0);
  const [uploadedPapers, setUploadedPapers] = useState<UploadedPaper[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fakeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── File Management 

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles = Array.from(incoming).filter(
      (f) => !files.some((existing) => existing.name === f.name)
    );
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  // ── Drag & Drop 

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [files]
  );

  // ── Fake Progress

  const startFakeProgress = (duration: number) => {
    setFakeProgress(0);
    const interval = 200;
    const steps = duration / interval;
    let current = 0;

    fakeTimerRef.current = setInterval(() => {
      current += 1;
      // Ease-out curve: fast at start, slows near 90%
      const raw = current / steps;
      const eased = 1 - Math.pow(1 - raw, 2);
      const capped = Math.min(eased * 90, 90); // never exceed 90% until real completion
      setFakeProgress(capped);

      if (current >= steps) clearInterval(fakeTimerRef.current!);
    }, interval);
  };

  const completeFakeProgress = () => {
    if (fakeTimerRef.current) clearInterval(fakeTimerRef.current);
    setFakeProgress(100);
  };

  // Upload

  const handleUpload = async () => {
    if (files.length === 0) return;
    setStage("uploading");

    try {
      const sessionRes = await fetch("http://localhost:8000/api/session", {
        method: "POST",
      });
      if (!sessionRes.ok) throw new Error("Failed to create session");
      const { session_id: id } = await sessionRes.json();
      setSessionId(id);

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `http://localhost:8000/api/session/${id}/upload`);

        xhr.upload.onprogress = () => {
          // Transfer finished: switch to processing stage & start fake bar
          setStage("processing");
          startFakeProgress(estimateDuration(files));
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response: { uploaded: UploadedPaper[] } = JSON.parse(xhr.responseText);
            setUploadedPapers(response.uploaded);
            completeFakeProgress();
            setTimeout(() => {
              setStage("done");
            }, 600);
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed");
      setStage("idle");
    }
  };

  // Render

  if (stage === "done" && sessionId) {
    return <ChatPage sessionId={sessionId} uploadedPapers={uploadedPapers} />;
  }


  if (stage === "processing" || stage === "uploading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: " #111827",
          padding: "40px",
        }}
      >
        <Card
          elevation={Elevation.THREE}
          style={{
            width: "480px",
            padding: "40px",
            background: "#1c2333",
            borderRadius: "12px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Icon
              icon="document"
              size={48}
              color="#4C90F0"
              style={{ marginBottom: "16px" }}
            />
            <H2 style={{ color: "#F5F8FA", margin: "0 0 8px" }}>
              Processing Papers
            </H2>
            <Text style={{ color: "#8A9BA8" }}>
              Chunking, embedding, and indexing your documents. This may take a
              moment depending on file size.
            </Text>
          </div>

          <ProgressBar
            value={fakeProgress / 100}
            intent={Intent.PRIMARY}
            animate={fakeProgress < 100}
            stripes={fakeProgress < 100}
            style={{ height: "10px", borderRadius: "6px", marginBottom: "12px" }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            <Text style={{ color: "#4C90F0", fontSize: "13px", fontWeight: 600 }}>
              {Math.round(fakeProgress)}%
            </Text>
          </div>

          <Divider style={{ borderColor: "#2d3f55", marginBottom: "20px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {files.map((f) => (
              <div
                key={f.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#253047",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon="document" size={12} color="#4C90F0" />
                  <Text style={{ color: "#CED9E0", fontSize: "13px" }}>
                    {f.name}
                  </Text>
                </div>
                <Tag minimal intent={Intent.PRIMARY} style={{ fontSize: "11px" }}>
                  {(f.size / 1024).toFixed(0)} KB
                </Tag>
              </div>
            ))}
          </div>

          <Callout
            intent={Intent.WARNING}
            icon="time"
            style={{ marginTop: "20px", background: "#2d2a1a", borderRadius: "8px" }}
          >
            <Text style={{ color: "#e4e4e4", fontSize: "13px" }}>
              Please keep this tab open while processing completes.
            </Text>
          </Callout>
        </Card>
      </div>
    );
  }

  // ── Render: Idle ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <H2 style={{ color: "#e4e4e4", margin: "0 0 8px", fontSize: "28px" }}>
            Research Paper Upload
          </H2>
          <Text style={{ color: "#e4e4e4" }}>
            Upload one or more PDFs to start a research session.
          </Text>
        </div>

        {/* Drop Zone */}
        <Card
          elevation={Elevation.TWO}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#4C90F0" : "#2d3f55"}`,
            borderRadius: "12px",
            background: dragOver ? "#1a2744" : "#1c2333",
            padding: "40px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "20px",
          }}
        >
          <Icon
            icon="cloud-upload"
            size={36}
            color={dragOver ? "#4C90F0" : "#5C7080"}
            style={{ marginBottom: "12px" }}
          />
          <H5 style={{ color: "#e4e4e4", margin: "0 0 6px" }}>
            Drop PDF files or click to browse
          </H5>
          <Text style={{ color: "#5C7080", fontSize: "13px" }}>
            Supports ONLY PDF files at the moment
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
        </Card>

        {/* File List */}
        {files.length > 0 ? (
          <Card
            elevation={Elevation.ONE}
            style={{
              background: "#1c2333",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <Text
                style={{ color: "#e4e4e4", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                {files.length} file{files.length !== 1 ? "s" : ""} queued
              </Text>
              <Button
                minimal
                small
                intent={Intent.DANGER}
                text="Clear all"
                onClick={() => setFiles([])}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {files.map((f) => (
                <div
                  key={f.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#253047",
                    borderRadius: "8px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = "#2d3f5a")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = "#253047")
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <Icon icon="document" size={14} color="#4C90F0" />
                    <Text
                      style={{
                        color: "#e4e4e4",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "360px",
                      }}
                    >
                      {f.name}
                    </Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <Tag
                      minimal
                      style={{
                        background: "#1c3456",
                        color: "#8ABBFF",
                        fontSize: "11px",
                      }}
                    >
                      {(f.size / 1024).toFixed(0)} KB
                    </Tag>
                    <Button
                      minimal
                      small
                      icon="cross"
                      intent={Intent.DANGER}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(f.name);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div style={{ marginBottom: "20px" }}>

          </div>
        )}

        {/* Upload Button */}
        <Button
          large
          fill
          intent={Intent.PRIMARY}
          disabled={files.length === 0}
          onClick={handleUpload}
          icon="rocket-slant"
          text="Start Session & Process Papers"
          style={{
            borderRadius: "8px",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        />
      </div>
    </div>
  );
}