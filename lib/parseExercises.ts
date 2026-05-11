import { Exercise } from "./types";

export function parseExercises(markdown: string): Exercise[] {
  const exercises: Exercise[] = [];
  const lines = markdown.split("\n");
  let current: { number: number; type: string; lines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^\*\*Exercise (\d+)\*\*$/);

    if (headerMatch) {
      if (current) {
        exercises.push({
          number: current.number,
          type: current.type,
          content: current.lines.join("\n").trim(),
        });
      }
      const num = parseInt(headerMatch[1], 10);
      current = { number: num, type: "", lines: [line] };
    } else if (current) {
      current.lines.push(line);
      if (current.type === "" && line.trim().startsWith("**") && line.trim().endsWith("**")) {
        const instruction = line.trim().replace(/^\*\*|\*\*$/g, "");
        current.type = guessExerciseType(instruction);
      }
    }
  }

  if (current) {
    exercises.push({
      number: current.number,
      type: current.type,
      content: current.lines.join("\n").trim(),
    });
  }

  return exercises;
}

function guessExerciseType(instruction: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes("match")) return "Matching";
  if (lower.includes("gap") || lower.includes("fill in") || lower.includes("complete the sentence")) return "Gap Fill";
  if (lower.includes("dialogue") || lower.includes("conversation")) return "Complete the Dialogue";
  if (lower.includes("odd one out")) return "Odd One Out";
  if (lower.includes("choose the correct") || lower.includes("circle")) return "Choose the Correct Word";
  if (lower.includes("highlight")) return "Highlight the Correct Option";
  if (lower.includes("categor")) return "Categorise";
  if (lower.includes("unscramble")) return "Unscramble";
  if (lower.includes("collocation")) return "Collocations";
  if (lower.includes("text") || lower.includes("passage")) return "Complete the Text";
  if (lower.includes("recipe") || lower.includes("instructions")) return "Complete the Instructions";
  return "Exercise";
}

export function reassembleWorksheet(exercises: Exercise[]): string {
  return exercises.map((ex) => ex.content).join("\n\n");
}

export function toStudentMarkdown(teacherMarkdown: string): string {
  const lines = teacherMarkdown.split("\n");
  return lines
    .map((line) => {
      if (/^\*\*[^*]+\*\*$/.test(line.trim())) return line;
      if (line.trim().startsWith(">")) return line;
      line = line.replace(/ — \*\*([A-Z])\*\*/g, " — ____");
      line = line.replace(/\*\*([^*]+)\*\*/g, "______________");
      return line;
    })
    .join("\n");
}
