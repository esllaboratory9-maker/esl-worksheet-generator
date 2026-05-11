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
  const [fileContent, setFileContent] = useState(state.fileContent ?? "");   // plain text
  const [fileBase64, setFileBase64] = useState(state.fileBase64 ?? "");      // PDF base64
  const [fileType, setFileType] = useState(state.fileType ?? "");
  const [fileName, setFileName] = useState(state.fileName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFile = !!(fileContent || fileBase64);

  const MAX_FILE_MB = 3;

  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please use a file under ${MAX_FILE_MB} MB.`);
      return;
    }
    setError("");
    setFileName(file.name);
    setFileType(file.type);
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        setFileBase64(base64);
        setFileContent("");
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setFileContent(text);
      setFileBase64("");
    }
  };

  const handleClear = () => {
    setFileContent("");
    setFileBase64("");
    setFileType("");
    setFileName("");
  };

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const body =
        inputMode === "file"
          ? { level, fileContent, fileBase64, fileType, fileName }
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
        fileBase64: inputMode === "file" ? fileBase64 : undefined,
        fileType: inputMode === "file" ? fileType : undefined,
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

      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          background: "#F3F4F6",
          borderRadius: 10,
          padding: 4,
          marginBottom: 28,
          gap: 4,
        }}
      >
        {(["topic", "file"] as InputMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 7,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              background: inputMode === mode ? "#fff" : "transparent",
              color: inputMode === mode ? "#111827" : "#6B7280",
              boxShadow: inputMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            {mode === "topic" ? "Enter a topic" : "Upload lesson plan"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {inputMode === "topic" ? (
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Topic
            </label>
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
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Lesson plan file
            </label>
            <div
              onClick={() => !hasFile && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              style={{
                border: "2px dashed",
                borderColor: hasFile ? "#F06292" : "#E5E7EB",
                borderRadius: 10,
                padding: "32px 20px",
                textAlign: "center",
                cursor: hasFile ? "default" : "pointer",
                background: hasFile ? "#FFF5F8" : "#FAFAFA",
                transition: "all 0.15s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              {hasFile ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>
                    {fileType === "application/pdf" ? "📄" : "📝"}
                  </div>
                  <p style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 6 }}>
                    {fileName}
                  </p>
                  <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 10 }}>
                    {fileType === "application/pdf"
                      ? "PDF uploaded — ready to analyse"
                      : `${Math.round(fileContent.length / 1000)}k characters`}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    style={{
                      background: "none",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 6,
                      padding: "4px 14px",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "#6B7280",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                  <p style={{ color: "#374151", fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                    Drop your lesson plan here, or click to browse
                  </p>
                  <p style={{ color: "#9CA3AF", fontSize: 12 }}>PDF, TXT, DOCX · max 3 MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            CEFR Level
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {LEVELS.map((l) => {
              const s = LEVEL_STYLES[l];
              const isSelected = level === l;
              return (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 20,
                    border: `2px solid ${isSelected ? s.activeBorder : s.border}`,
                    background: isSelected ? s.bg : "#fff",
                    color: s.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 0 0 2px ${s.border}` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

        <button
          className="btn-primary"
          disabled={!canGenerate || loading}
          onClick={handleGenerate}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "11px 24px" }}
        >
          {loading ? (
            <>
              <Spinner size={16} />
              Generating worksheet angles…
            </>
          ) : (
            "Generate Angles"
          )}
        </button>
      </div>
    </div>
  );
}
