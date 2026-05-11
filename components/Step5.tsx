"use client";

import { useState } from "react";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import { AppState } from "@/lib/types";

interface Props {
  state: AppState;
  onBack: () => void;
  onRestart: () => void;
}

async function downloadDocx(markdown: string, version: "teacher" | "student", topic: string) {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown, version }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${topic.toLowerCase().replace(/\s+/g, "-")}-worksheet-${version}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Step5({ state, onBack, onRestart }: Props) {
  const [loading, setLoading] = useState<"teacher" | "student" | "both" | null>(null);
  const [error, setError] = useState("");

  const handle = async (version: "teacher" | "student" | "both") => {
    setError("");
    setLoading(version);
    try {
      if (version === "both") {
        await downloadDocx(state.worksheetMarkdown, "teacher", state.topic);
        await downloadDocx(state.worksheetMarkdown, "student", state.topic);
      } else {
        await downloadDocx(state.worksheetMarkdown, version, state.topic);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#6B7280",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 24,
          padding: 0,
        }}
      >
        ← Back to preview
      </button>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
          Export Worksheet
        </h2>
        <p style={{ color: "#6B7280", fontSize: 14 }}>
          {state.selectedAngles?.map((a) => a.title).join(" + ")} · {state.level}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Teacher version */}
        <div
          className="card"
          style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "#FCE4EC",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            📋
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
              Teacher Version
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
              Includes bold inline answers. For your reference.
            </p>
          </div>
          <button
            className="btn-outline"
            disabled={loading !== null}
            onClick={() => handle("teacher")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px" }}
          >
            {loading === "teacher" ? <Spinner size={14} /> : "⬇"}
            Download .docx
          </button>
        </div>

        {/* Student version */}
        <div
          className="card"
          style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "#E8F5E9",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            📝
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
              Student Version
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
              Blanks replacing all answers. Ready to print.
            </p>
          </div>
          <button
            className="btn-outline"
            disabled={loading !== null}
            onClick={() => handle("student")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px" }}
          >
            {loading === "student" ? <Spinner size={14} /> : "⬇"}
            Download .docx
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20 }}>
          <ErrorMessage message={error} />
        </div>
      )}

      <button
        className="btn-primary"
        disabled={loading !== null}
        onClick={() => handle("both")}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", fontSize: 15, marginBottom: 32 }}
      >
        {loading === "both" ? <Spinner size={16} /> : null}
        {loading === "both" ? "Downloading…" : "Download Both"}
      </button>

      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 24 }}>
        <button
          onClick={onRestart}
          style={{
            background: "none",
            border: "none",
            color: "#F06292",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Create another worksheet →
        </button>
      </div>
    </div>
  );
}
