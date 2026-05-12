"use client";

import { useState, useRef } from "react";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import { Angle, AppState, InputMode } from "@/lib/types";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string; activeBorder: string }> = {
  A1: { bg: "#F5F0E8", text: "#7C6042", border: "#D4C4A8", activeBorder: "#7C6042" },
  A2: { bg: "#FCE4EC", text: "#AD1457", border: "#F48FB1", activeBorder: "#AD1457" },
  B1: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7", activeBorder: "#2E7D32" },
  B2: { bg: "#E3F2FD", text: "#1565C0", border: "#90CAF9", activeBorder: "#1565C0" },
  C1: { bg: "#EDE7F6", text: "#4527A0", border: "#B39DDB", activeBorder: "#4527A0" },
};

interface Props {
  state: AppState;
  onNext: (updates: Partial<AppState & { angles: Angle[] }>) => void;
}

export default function Step1({ state, onNext }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>(state.inputMode ?? "topic");
  const [topic, setTopic] = useState(state.topic ?? "");
  const [level, setLevel] = useState(state.level ?? "");
  const [fileContent, setFileContent] = useState(state.fileContent ?? "");
  const [fileId, setFileId] = useState(state.fileId ?? "");
  const [fileName, setFileName] = useState(state.fileName ?? "");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFile = !!(fileContent || fileId);

  const handleFileUpload = async (file: File) => {
    setError("");
    setFileName(file.name);
    setUploading(true);

    try {
      if (file.type === "application/pdf") {
        if (file.size > 4 * 1024 * 1024) {
          throw new Error(
            `PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB — our server limit is 4 MB. ` +
            `Please compress it first at smallpdf.com or ilovepdf.com and try again.`
          );
        }
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload-file", { method: "POST", body: form });
        let data: { fileId?: string; error?: string };
        try {
          data = await res.json();
        } catch {
          const text = await res.text().catch(() => "");
          throw new Error(
            text.includes("Entity Too Large") || text.includes("Request En")
              ? "PDF is too large for our server (max 4 MB). Please compress it first at smallpdf.com."
              : `Upload failed: ${text || res.statusText}`
          );
        }
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setFileId(data.fileId!);
        setFileContent("");
      } else {
        const text = await file.text();
        setFileContent(text);
        setFileId("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFileContent("");
    setFileId("");
    setFileName("");
    setError("");
  };

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const body = inputMode === "file"
        ? { level, fileContent: fileContent || undefined, fileId: fileId || undefined, fileName }
        : { topic, level };

      const res = await fetch("/api/angles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate angles");

      onNext({
        step: 2,
        inputMode,
        topic: inputMode === "topic" ? topic : fileName.replace(/\.[^.]+$/, ""),
        level,
        fileContent: inputMode === "file" ? fileContent : undefined,
        fileId: inputMode === "file" ? fileId : undefined,
        fileName: inputMode === "file" ? fileName : undefined,
        selectedAngles: [],
        vocabulary: [],
        worksheetMarkdown: "",
        exercises: [],
        angles: data.angles,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = level && (inputMode === "topic" ? topic.trim() : hasFile);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Create a Vocabulary Worksheet
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>
          Generate a classroom-ready ESL worksheet in a few steps.
        </p>
      </div>

      <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 28, gap: 4 }}>
        {(["topic", "file"] as InputMode[]).map((mode) => (
          <button key={mode} onClick={() => setInputMode(mode)} style={{
            flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", fontSize: 14,
            fontWeight: 500, cursor: "pointer",
            background: inputMode === mode ? "#fff" : "transparent",
            color: inputMode === mode ? "#111827" : "#6B7280",
            boxShadow: inputMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}>
            {mode === "topic" ? "Enter a topic" : "Upload lesson plan"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {inputMode === "topic" ? (
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Topic</label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. Easter, Job Interviews, Climate Change…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canGenerate && !loading && handleGenerate()}
            />
          </div>
        ) : (
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Lesson plan file</label>
            <div
              onClick={() => !hasFile && !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
              style={{
                border: "2px dashed", borderColor: hasFile ? "#F06292" : "#E5E7EB",
                borderRadius: 10, padding: "32px 20px", textAlign: "center",
                cursor: hasFile || uploading ? "default" : "pointer",
                background: hasFile ? "#FFF5F8" : "#FAFAFA", transition: "all 0.15s",
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.doc"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />

              {uploading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <Spinner size={28} />
                  <p style={{ color: "#6B7280", fontSize: 14 }}>Uploading file…</p>
                </div>
              ) : hasFile ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
                  <p style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 6 }}>{fileName}</p>
                  <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 10 }}>
                    {fileId ? "PDF ready — full content will be analysed" : `${Math.round(fileContent.length / 1000)}k characters`}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    style={{ background: "none", border: "1.5px solid #E5E7EB", borderRadius: 6, padding: "4px 14px", fontSize: 12, cursor: "pointer", color: "#6B7280" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                  <p style={{ color: "#374151", fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                    Drop your lesson plan here, or click to browse
                  </p>
                  <p style={{ color: "#9CA3AF", fontSize: 12 }}>PDF, TXT, DOCX supported</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>CEFR Level</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {LEVELS.map((l) => {
              const s = LEVEL_STYLES[l];
              const isSelected = level === l;
              return (
                <button key={l} onClick={() => setLevel(l)} style={{
                  padding: "7px 18px", borderRadius: 20,
                  border: `2px solid ${isSelected ? s.activeBorder : s.border}`,
                  background: isSelected ? s.bg : "#fff", color: s.text,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: isSelected ? `0 0 0 2px ${s.border}` : "none",
                  transition: "all 0.15s",
                }}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={undefined} />}

        <button
          className="btn-primary"
          disabled={!canGenerate || loading || uploading}
          onClick={handleGenerate}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "11px 24px" }}
        >
          {loading ? <><Spinner size={16} />Generating worksheet angles…</> : "Generate Angles"}
        </button>
      </div>
    </div>
  );
}
