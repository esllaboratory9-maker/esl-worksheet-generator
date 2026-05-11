"use client";

import React from "react";

function renderMarkdownLine(line: string, key: number): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </span>
  );
}

export default function WorksheetRenderer({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={`gap-${i}`} style={{ height: 8 }} />);
      i++;
      continue;
    }

    // Full-line bold (exercise header or instruction)
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      const text = line.trim().replace(/^\*\*|\*\*$/g, "");
      const isExerciseHeader = /^Exercise \d+$/.test(text);
      elements.push(
        <p
          key={`bold-${i}`}
          style={{
            fontWeight: 700,
            fontSize: isExerciseHeader ? 14 : 13,
            color: isExerciseHeader ? "#6B7280" : "#111827",
            margin: "2px 0",
            textTransform: isExerciseHeader ? "uppercase" : "none",
            letterSpacing: isExerciseHeader ? "0.04em" : "normal",
          }}
        >
          {text}
        </p>
      );
      i++;
      continue;
    }

    // Word box blockquote
    if (line.trim().startsWith(">")) {
      const text = line.trim().replace(/^>\s*/, "");
      elements.push(
        <div
          key={`wordbox-${i}`}
          style={{
            border: "1px solid #D1D5DB",
            borderRadius: 6,
            padding: "8px 14px",
            background: "#F9FAFB",
            fontSize: 13,
            color: "#374151",
            margin: "6px 0",
          }}
        >
          {text}
        </div>
      );
      i++;
      continue;
    }

    // Regular line with possible inline bold
    elements.push(
      <p key={`line-${i}`} style={{ margin: "2px 0", fontSize: 13.5, color: "#111827", lineHeight: 1.65 }}>
        {renderMarkdownLine(line, i)}
      </p>
    );
    i++;
  }

  return <div className="worksheet-content">{elements}</div>;
}
