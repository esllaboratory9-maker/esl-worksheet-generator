"use client";

import { useState } from "react";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import WorksheetRenderer from "./WorksheetRenderer";
import { Exercise, AppState, Angle } from "@/lib/types";
import { reassembleWorksheet, toStudentMarkdown } from "@/lib/parseExercises";

interface Props {
  state: AppState;
  onNext: (updates: Partial<AppState & { angles: Angle[] }>) => void;
  onBack: () => void;
}

interface ExerciseCardProps {
  exercise: Exercise;
  level: string;
  topic: string;
  vocabulary: AppState["vocabulary"];
  previewMode: "teacher" | "student";
  onUpdate: (content: string) => void;
}

function ExerciseCard({ exercise, level, topic, vocabulary, previewMode, onUpdate }: ExerciseCardProps) {
  const [showRegenPanel, setShowRegenPanel] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [error, setError] = useState("");

  const displayContent =
    previewMode === "student" ? toStudentMarkdown(exercise.content) : exercise.content;

  const handleShowRegen = async () => {
    setShowRegenPanel(true);
    if (reasons.length === 0) {
      setReasonsLoading(true);
      try {
        const res = await fetch("/api/regen-reasons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseType: exercise.type,
            exerciseContent: exercise.content,
            level,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load reasons");
        setReasons(data.reasons);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reasons");
      } finally {
        setReasonsLoading(false);
      }
    }
  };

  const handleRegen = async () => {
    const reason = customReason || selectedReason;
    if (!reason) return;
    setError("");
    setRegenLoading(true);
    try {
      const res = await fetch("/api/regen-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          level,
          vocabulary,
          exerciseNumber: exercise.number,
          exerciseType: exercise.type,
          exerciseContent: exercise.content,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate");
      onUpdate(data.markdown);
      setShowRegenPanel(false);
      setSelectedReason("");
      setCustomReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden", position: "relative" }}
    >
      {regenLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            borderRadius: 12,
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Spinner size={28} />
          <span style={{ fontSize: 13, color: "#6B7280" }}>Regenerating exercise…</span>
        </div>
      )}

      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Exercise {exercise.number}
          </span>
          <span
            style={{
              background: "#F3F4F6",
              color: "#6B7280",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {exercise.type}
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <WorksheetRenderer markdown={displayContent} />
      </div>

      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #F3F4F6",
          background: "#FAFAFA",
        }}
      >
        {!showRegenPanel ? (
          <button
            className="btn-outline"
            style={{ fontSize: 12, padding: "6px 12px" }}
            onClick={handleShowRegen}
          >
            Regenerate
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {error && <ErrorMessage message={error} />}
            {reasonsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6B7280", fontSize: 13 }}>
                <Spinner size={14} />
                Loading suggestions…
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {reasons.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedReason(r === selectedReason ? "" : r)}
                    style={{
                      background: selectedReason === r ? "#FCE4EC" : "#F3F4F6",
                      border: `1.5px solid ${selectedReason === r ? "#F06292" : "#E5E7EB"}`,
                      color: selectedReason === r ? "#AD1457" : "#374151",
                      borderRadius: 20,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
            <input
              className="input-field"
              placeholder="Or type a custom reason…"
              style={{ fontSize: 13, padding: "8px 12px" }}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-primary"
                disabled={(!selectedReason && !customReason) || regenLoading}
                onClick={handleRegen}
                style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}
              >
                {regenLoading ? <Spinner size={14} /> : null}
                Regenerate this exercise
              </button>
              <button
                className="btn-outline"
                style={{ fontSize: 13, padding: "8px 12px" }}
                onClick={() => {
                  setShowRegenPanel(false);
                  setSelectedReason("");
                  setCustomReason("");
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Step4({ state, onNext, onBack }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>(state.exercises);
  const [previewMode, setPreviewMode] = useState<"teacher" | "student">("teacher");

  const handleUpdateExercise = (index: number, content: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content };
      return updated;
    });
  };

  const handleExport = () => {
    const markdown = reassembleWorksheet(exercises);
    onNext({ step: 5, exercises, worksheetMarkdown: markdown });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
          marginBottom: 20,
          padding: 0,
        }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            Worksheet Preview
          </h2>
          <p style={{ color: "#6B7280", fontSize: 13 }}>{state.selectedAngles.map((a) => a.title).join(" + ")}</p>
        </div>

        {/* Teacher / Student toggle */}
        <div
          style={{
            display: "flex",
            background: "#F3F4F6",
            borderRadius: 8,
            padding: 3,
            gap: 3,
          }}
        >
          {(["teacher", "student"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                background: previewMode === mode ? "#fff" : "transparent",
                color: previewMode === mode ? "#111827" : "#6B7280",
                boxShadow: previewMode === mode ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {mode} version
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={exercise.number}
            exercise={exercise}
            level={state.level}
            topic={state.topic}
            vocabulary={state.vocabulary}
            previewMode={previewMode}
            onUpdate={(content) => handleUpdateExercise(i, content)}
          />
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={handleExport}
        style={{ padding: "11px 28px", fontSize: 15 }}
      >
        Export →
      </button>
    </div>
  );
}
