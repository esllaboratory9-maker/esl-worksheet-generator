import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Angle } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, level, angles, fileContent, fileId } = body as {
      topic: string;
      level: string;
      angles: Angle[];
      fileContent?: string;
      fileId?: string;
    };

    const isMixed = angles.length > 1;
    const isGrammar = angles.every((a) => a.vocabulary_type.toLowerCase().includes("grammar"));
    const anglesDescription = angles
      .map((a, i) => `${i + 1}. ${a.title} (${a.vocabulary_type}) — ${a.description}`)
      .join("\n");
    const itemsPerAngle = isMixed ? Math.ceil(12 / angles.length) : 12;
    const hasSource = !!(fileContent || fileId);

    const sourceExampleField = hasSource
      ? `- source_example — the exact sentence or phrase from the lesson plan where this word appears. Copy it verbatim. If the word does not appear directly, use an empty string "".`
      : "";
    const sourceExampleJson = hasSource ? `, "source_example": "..."` : "";

    const systemPrompt = isGrammar
      ? `You are a grammar specialist for ESL Laboratory (esllaboratory.com).

Generate a list of grammar rules for:
- Topic: ${topic}
- Level: ${level}
- Angles:\n${anglesDescription}

Produce exactly 12 grammar items. Each item:
- word — the grammar structure name
- definition — clear explanation at the target level
- example — one natural example sentence
- part_of_speech — always "grammar rule"
${sourceExampleField}

Return a JSON array only.
[{ "word": "...", "definition": "...", "example": "...", "part_of_speech": "grammar rule"${sourceExampleJson} }]`
      : `You are a vocabulary specialist for ESL Laboratory (esllaboratory.com).

Generate a vocabulary list for:
- Topic: ${topic}
- Level: ${level}
${isMixed
  ? `- Mixed angles:\n${anglesDescription}\n\nDistribute 12 items proportionally — ~${itemsPerAngle} per angle.`
  : `- Angle: ${angles[0]?.title}\n- Covers: ${angles[0]?.description}`}

Produce exactly 12 vocabulary items:
- word — the vocabulary item
- definition — clear definition at the target level (don't use the word in its own definition)
- example — one natural example sentence
- part_of_speech — e.g. noun, verb, adjective, phrase, idiom
${sourceExampleField}

Level guidance:
- A1–A2: 5–8 word definitions, simple sentences
- A2–B1: 8–12 word definitions, medium sentences
- B1–B2: 10–15 word definitions, natural sentences
- B2–C1: 12–18 word definitions, authentic register

Rules: all items distinct, no near-synonyms, sort alphabetically.

Return a JSON array only.
[{ "word": "...", "definition": "...", "example": "...", "part_of_speech": "..."${sourceExampleJson} }]`;

    const userContent: unknown[] = [];

    if (fileId) {
      userContent.push({
        type: "document",
        source: { type: "file", file_id: fileId },
      });
      userContent.push({
        type: "text",
        text: `Generate vocabulary for: ${angles.map((a) => a.title).join(" + ")}`,
      });
    } else if (fileContent) {
      userContent.push({
        type: "text",
        text: `Generate vocabulary for: ${angles.map((a) => a.title).join(" + ")}\n\nLesson plan context:\n${fileContent.slice(0, 6000)}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Generate vocabulary for: ${angles.map((a) => a.title).join(" + ")}`,
      });
    }

    const options = fileId ? { headers: { "anthropic-beta": "files-api-2025-04-14" } } : {};

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent as any }],
    }, options);

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const vocabulary = JSON.parse(jsonMatch[0]).map(
      (item: Record<string, string>, idx: number) => ({
        ...item,
        approved: true,
        id: `vocab-${idx}-${Date.now()}`,
      })
    );

    return NextResponse.json({ vocabulary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
