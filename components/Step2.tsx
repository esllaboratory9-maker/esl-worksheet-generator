"use client";

import { useState } from "react";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import { Angle, AppState } from "@/lib/types";

interface Props {
  state: AppState & { angles: Angle[] };
  onNext: (updates: Partial<AppState & { angles: Angle[] }>) => void;
  onBack: () => void;
}

const MAX_SELECT = 3;

export default function Step2({ state, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<Angle[]>(state.selectedAngles ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (angle: Angle) => {
    setSelected((prev) => {
      const already = prev.find((a) => a.title === angle.title);
      if (already) return prev.filter((a) => a.title !== angle.title);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, angle];
    });
  };

  const handleContinue = async () => {
    if (!selected.length) return;
    setError("");
    setLoading(true);
    try {
      const body = {
        topic: state.topic,
        level: state.level,
        angles: selected,
        fileContent: state.fileContent,
        fileId: state.fileId,
      };
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate vocabulary");

      onNext({ step: 3, selectedAngles: selected, vocabulary: data.vocabulary });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const btnLabel =
    selected.length === 0
      ? "Select an angle"
      : selected.length === 1
      ? "Use This Angle"
      : `Mix ${selected.length} Angles`;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", color: "#6B7280", fontSize: 13,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          marginBottom: 20, padding: 0,
        }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
            Choose Worksheet Angle{selected.length > 1 ? "s" : ""}
          </h2>
          <p style={{ color: "#6B7280", fontSize: 14 }}>
            Topic: <strong>{state.topic}</strong> · Level: <strong>{state.level}</strong>
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span
            style={{
              display: "inline-block",
              background: selected.length ? "#FCE4EC" : "#F3F4F6",
              color: selected.length ? "#AD1457" : "#9CA3AF",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {selected.length} / {MAX_SELECT} selected
          </span>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Pick up to {MAX_SELECT} to mix</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 24 }}>
        {state.angles.map((angle, i) => {
          const isSelected = !!selected.find((a) => a.title === angle.title);
          const selIndex = selected.findIndex((a) => a.title === angle.title);
          const isDisabled = !isSelected && selected.length >= MAX_SELECT;

          return (
            <div
              key={i}
              onClick={() => !isDisabled && toggle(angle)}
              style={{
                padding: "18px 20px",
                borderRadius: 12,
                border: `2px solid ${isSelected ? "#F06292" : "#E5E7EB"}`,
                background: isSelected ? "#FFF5F8" : "#fff",
                boxShadow: isSelected ? "0 0 0 3px #FCE4EC" : "0 1px 3px rgba(0,0,0,0.06)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.45 : 1,
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {/* Selection badge */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `2px solid ${isSelected ? "#F06292" : "#D1D5DB"}`,
                  background: isSelected ? "#F06292" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {isSelected ? selIndex + 1 : ""}
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8, paddingRight: 28, lineHeight: 1.3 }}>
                {angle.title}
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12, lineHeight: 1.5 }}>
                {angle.description}
              </p>
              <span
                style={{
                  display: "inline-block",
                  background: isSelected ? "#F06292" : "#F3F4F6",
                  color: isSelected ? "#fff" : "#6B7280",
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {angle.vocabulary_type}
              </span>
            </div>
          );
        })}
      </div>

      {selected.length > 1 && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1.5px solid #A5D6A7",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            color: "#2E7D32",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✦</span>
          Claude will blend vocabulary from all {selected.length} angles into a single mixed worksheet.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16 }}>
          <ErrorMessage message={error} onRetry={handleContinue} />
        </div>
      )}

      <button
        className="btn-primary"
        disabled={!selected.length || loading}
        onClick={handleContinue}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px" }}
      >
        {loading ? (
          <>
            <Spinner size={16} />
            Generating vocabulary…
          </>
        ) : (
          btnLabel
        )}
      </button>
    </div>
  );
}
