"use client";

import { useState } from "react";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import { VocabItem, AppState, Angle } from "@/lib/types";
import { parseExercises } from "@/lib/parseExercises";

interface Props {
  state: AppState;
  onNext: (updates: Partial<AppState & { angles: Angle[] }>) => void;
  onBack: () => void;
}

function VocabRow({
  item,
  onUpdate,
  onDelete,
  onRegenerate,
}: {
  item: VocabItem;
  onUpdate: (updated: VocabItem) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [regenLoading, setRegenLoading] = useState(false);

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ padding: "14px 16px", border: "2px solid #F06292", borderRadius: 10, background: "#FFF5F8", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Word</label>
            <input className="input-field" style={{ marginTop: 4 }} value={draft.word} onChange={(e) => setDraft({ ...draft, word: e.target.value })} />
          </div>
          <div style={{ width: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Part of speech</label>
            <input className="input-field" style={{ marginTop: 4 }} value={draft.part_of_speech} onChange={(e) => setDraft({ ...draft, part_of_speech: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Definition</label>
          <textarea className="input-field" style={{ marginTop: 4, resize: "vertical", minHeight: 60 }} value={draft.definition} onChange={(e) => setDraft({ ...draft, definition: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Example sentence</label>
          <input className="input-field" style={{ marginTop: 4 }} value={draft.example} onChange={(e) => setDraft({ ...draft, example: e.target.value })} />
        </div>
        {draft.source_example && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.05em" }}>From lesson (read-only)</label>
            <p style={{ fontSize: 12, color: "#0C4A6E", fontStyle: "italic", marginTop: 4, padding: "6px 10px", background: "#F0F9FF", borderRadius: 6, borderLeft: "3px solid #7DD3FC" }}>
              "{draft.source_example}"
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ padding: "7px 16px", fontSize: 13 }} onClick={handleSave}>Save</button>
          <button className="btn-outline" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => { setDraft(item); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 16px", border: "1.5px solid #E5E7EB", borderRadius: 10, background: "#fff", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.word}</span>
          <span style={{ background: "#F3F4F6", color: "#6B7280", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 500 }}>
            {item.part_of_speech}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#374151", marginBottom: 3 }}>{item.definition}</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>"{item.example}"</p>
        {item.source_example && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6,
            background: "#F0F9FF", borderLeft: "3px solid #7DD3FC",
            borderRadius: "0 6px 6px 0", padding: "5px 10px",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0369A1", flexShrink: 0, marginTop: 1 }}>FROM LESSON</span>
            <p style={{ fontSize: 12, color: "#0C4A6E", fontStyle: "italic", margin: 0 }}>"{item.source_example}"</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button title="Edit" onClick={() => setEditing(true)}
          style={{ background: "none", border: "1.5px solid #E5E7EB", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", fontSize: 14 }}>
          ✎
        </button>
        <button title="Regenerate" onClick={onRegenerate} disabled={regenLoading}
          style={{ background: "none", border: "1.5px solid #E5E7EB", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: regenLoading ? "not-allowed" : "pointer", color: "#6B7280", fontSize: 14 }}>
          {regenLoading ? <Spinner size={14} /> : "↻"}
        </button>
        <button title="Delete" onClick={onDelete}
          style={{ background: "none", border: "1.5px solid #E5E7EB", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444", fontSize: 16, fontWeight: 700 }}>
          ×
        </button>
      </div>
    </div>
  );
}

function AddWordRow({ level, onAdd }: { level: string; onAdd: (item: VocabItem) => void }) {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!word.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lookup-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim(), level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to look up word");
      onAdd({ ...data.item, approved: true, id: `custom-${Date.now()}` });
      setWord("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add word");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {error && <div style={{ marginBottom: 8 }}><ErrorMessage message={error} /></div>}
      <div style={{
        display: "flex", gap: 8, padding: "12px 14px",
        border: "1.5px dashed #E5E7EB", borderRadius: 10,
        background: "#FAFAFA", alignItems: "center",
      }}>
        <span style={{ fontSize: 18, color: "#D1D5DB" }}>+</span>
        <input
          className="input-field"
          placeholder="Add a word or phrase… Claude will fill in the definition"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleAdd()}
          style={{ border: "none", background: "transparent", padding: "0", fontSize: 13, boxShadow: "none", flex: 1 }}
        />
        <button
          className="btn-outline"
          disabled={!word.trim() || loading}
          onClick={handleAdd}
          style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          {loading ? <Spinner size={13} /> : null}
          {loading ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

export default function Step3({ state, onNext, onBack }: Props) {
  const [vocab, setVocab] = useState<VocabItem[]>(state.vocabulary);
  const [regenAllLoading, setRegenAllLoading] = useState(false);
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [error, setError] = useState("");

  const approved = vocab.filter((v) => v.approved !== false);
  const angleLabel = state.selectedAngles.length > 1
    ? state.selectedAngles.map((a) => a.title).join(" + ")
    : state.selectedAngles[0]?.title ?? "";

  const handleRegenAll = async () => {
    setError("");
    setRegenAllLoading(true);
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          level: state.level,
          angles: state.selectedAngles,
          fileContent: state.fileContent,
          fileId: state.fileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate");
      setVocab(data.vocabulary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRegenAllLoading(false);
    }
  };

  const handleRegenItem = async (index: number) => {
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          level: state.level,
          angles: state.selectedAngles,
          fileContent: state.fileContent,
          fileId: state.fileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate item");
      const newItem = data.vocabulary[Math.floor(Math.random() * data.vocabulary.length)];
      setVocab((prev) => {
        const updated = [...prev];
        updated[index] = { ...newItem, id: prev[index].id };
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to regenerate item");
    }
  };

  const handleGenerateWorksheet = async () => {
    setError("");
    setWorksheetLoading(true);
    try {
      const res = await fetch("/api/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          level: state.level,
          angleTitle: angleLabel,
          vocabulary: approved,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate worksheet");

      const exercises = parseExercises(data.markdown);
      onNext({ step: 4, vocabulary: vocab, worksheetMarkdown: data.markdown, exercises });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setWorksheetLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 20, padding: 0 }}>
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Vocabulary Approval</h2>
          <p style={{ color: "#6B7280", fontSize: 13, maxWidth: 480 }}>{angleLabel}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: approved.length >= 10 ? "#E8F5E9" : "#FFF3CD",
            color: approved.length >= 10 ? "#2E7D32" : "#856404",
            borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 600,
          }}>
            {approved.length} / {vocab.length} items
          </span>
          <button className="btn-outline" disabled={regenAllLoading} onClick={handleRegenAll}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px" }}>
            {regenAllLoading ? <Spinner size={14} /> : "↻"}
            Regenerate All
          </button>
        </div>
      </div>

      {approved.length < 10 && approved.length < vocab.length && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400E", marginBottom: 16 }}>
          You need at least 10 items to generate a worksheet. Currently: {approved.length}.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
        {vocab.map((item, i) => (
          <VocabRow
            key={item.id ?? i}
            item={item}
            onUpdate={(updated) => setVocab((prev) => { const copy = [...prev]; copy[i] = updated; return copy; })}
            onDelete={() => setVocab((prev) => prev.filter((_, idx) => idx !== i))}
            onRegenerate={() => handleRegenItem(i)}
          />
        ))}
      </div>

      <AddWordRow
        level={state.level}
        onAdd={(item) => setVocab((prev) => [...prev, item])}
      />

      {error && (
        <div style={{ marginTop: 16, marginBottom: 0 }}>
          <ErrorMessage message={error} onRetry={handleGenerateWorksheet} />
        </div>
      )}

      <button
        className="btn-primary"
        disabled={approved.length < 10 || worksheetLoading}
        onClick={handleGenerateWorksheet}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", marginTop: 24 }}
      >
        {worksheetLoading ? <><Spinner size={16} />Generating worksheet…</> : "Generate Worksheet"}
      </button>
    </div>
  );
}
