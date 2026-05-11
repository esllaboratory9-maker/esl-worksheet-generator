import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Angle } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, level, angles, fileContent, fileBase64, fileType, fileName } = body as {
      topic: string;
      level: string;
      angles: Angle[];
      fileContent?: string;
      fileBase64?: string;
      fileType?: string;
      fileName?: string;
    };

    const isPdf = fileType === "application/pdf" && !!fileBase64;
    const isMixed = angles.length > 1;
    const isGrammar = angles.every((a) => a.vocabulary_type.toLowerCase().includes("grammar"));

    const anglesDescription = angles
      .map((a, i) => `${i + 1}. ${a.title} (${a.vocabulary_type}) — ${a.description}`)
      .join("\n");

    const itemsPerAngle = isMixed ? Math.ceil(12 / angles.length) : 12;

    const hasSource = isPdf || !!fileContent;
    const sourceExampleField = hasSource
      ? `- source_example — the exact sentence or phrase from the lesson plan where this word appears. Copy it verbatim. If the word does not appear directly in the lesson plan, use an empty string "".`
      : "";
    const sourceExampleJson = hasSource ? `, "source_example": "..."` : "";

    const systemPrompt = isGrammar
      ? `You are a grammar specialist for ESL Laboratory (esllaboratory.com).

Generate a list of grammar rules for the following worksheet:
- Topic: ${topic}
- Level: ${level}
- Angles:\n${anglesDescription}

Produce exactly 12 grammar items covering all the angles proportionally. Each item:
- word — the grammar structure name
- definition — clear explanation at the target level
- example — one natural example sentence
- part_of_speech — always "grammar rule"
${sourceExampleField}

Return a JSON array only.
[{ "word": "...", "definition": "...", "example": "...", "part_of_speech": "grammar rule"${sourceExampleJson} }]`
      : `You are a vocabulary specialist for ESL Laboratory (esllaboratory.com).

Generate a vocabulary list for the following worksheet:
- Topic: ${topic}
- Level: ${level}
${isMixed ? `- Mixed angles (blend vocabulary from all):\n${anglesDescription}\n\nDistribute the 12 items proportionally across all angles — approximately ${itemsPerAngle} items per angle.` : `- Worksheet angle: ${angles[0]?.title}\n- What it covers: ${angles[0]?.description}`}

Produce exactly 12 vocabulary items. Each item must include:
- word — the vocabulary item as it will appear in the worksheet
- definition — clear, accurate definition at the target level (do not use the word in its own definition)
- example — one natural example sentence
- part_of_speech — e.g. noun, verb, adjective, adverb, phrase, idiom
${sourceExampleField}

Level guidance:
- A1–A2: very short definitions (5–8 words), simple sentences
- A2–B1: short definitions (8–12 words), medium sentences
- B1–B2: fuller definitions (10–15 words), natural sentences
- B2–C1: precise definitions (12–18 words), authentic register

Rules:
- Items must be genuinely useful and teachable
- No near-synonyms — all items must be distinct
- Sort alphabetically by word

Return a JSON array only.
[{ "word": "...", "definition": "...", "example": "...", "part_of_speech": "..."${sourceExampleJson} }]`;

    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

    const userContent: ContentBlock[] = [];

    if (isPdf) {
      userContent.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: fileBase64! },
      });
    }

    const contextNote = isPdf
      ? "(See attached lesson plan PDF for context.)"
      : fileContent
      ? `Lesson plan context:\n${fileContent.slice(0, 3000)}`
      : "";

    userContent.push({
      type: "text",
      text: `Generate vocabulary for: ${angles.map((a) => a.title).join(" + ")}${contextNote ? `\n\n${contextNote}` : ""}`,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: "user", content: userContent as any }],
    });

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
