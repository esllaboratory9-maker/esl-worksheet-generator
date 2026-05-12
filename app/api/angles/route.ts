import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, level, fileContent, fileId, fileName } = body as {
      topic?: string;
      level: string;
      fileContent?: string;
      fileId?: string;
      fileName?: string;
    };

    const isFileMode = !!(fileContent || fileId);

    const systemPrompt = isFileMode
      ? `You are a curriculum designer for ESL Laboratory (esllaboratory.com).

A teacher has uploaded a lesson plan and wants to create a vocabulary worksheet for ${level} learners.

Generate exactly 5 worksheet angles based on the lesson plan. Each angle is a specific lens through which the topic can be explored as a vocabulary worksheet.

For each angle provide:
- title — a short, specific worksheet title
- description — one sentence explaining what vocabulary this covers and why it suits this level
- vocabulary_type — the kind of vocabulary (e.g. nouns, collocations, idioms, adjectives, verbs, fixed phrases, grammar rules)

Rules:
- Each angle must be genuinely distinct
- Titles must be specific enough that a teacher immediately knows what vocabulary is in the worksheet
- Angles must be realistic and teachable at ${level} level
- If the lesson plan focuses on grammar, at least one angle may be grammar-focused

Return a JSON array only. No other text.
[{ "title": "...", "description": "...", "vocabulary_type": "..." }]`
      : `You are a curriculum designer for ESL Laboratory (esllaboratory.com).

A teacher wants to create a vocabulary worksheet on the topic of ${topic} for ${level} learners.

Generate exactly 5 worksheet angles. Each angle is a specific lens through which the topic can be explored as a vocabulary worksheet.

For each angle provide:
- title — a short, specific worksheet title (e.g. "Easter Food Vocabulary — Hot Cross Buns, Lamb & More")
- description — one sentence explaining what vocabulary this covers and why it suits this level
- vocabulary_type — the kind of vocabulary (e.g. nouns, collocations, idioms, adjectives, verbs, fixed phrases)

Rules:
- Each angle must be genuinely distinct
- Angles must be realistic and teachable at ${level} level — do not suggest idioms at A1, do not suggest basic nouns at C1
- Do not include grammar-focused angles — vocabulary only

Return a JSON array only. No other text.
[{ "title": "...", "description": "...", "vocabulary_type": "..." }]`;

    const userContent: unknown[] = [];

    if (fileId) {
      userContent.push({
        type: "document",
        source: { type: "file", file_id: fileId },
      });
      userContent.push({
        type: "text",
        text: `Lesson plan file: ${fileName ?? "uploaded file"}\nLevel: ${level}\n\nGenerate 5 angles for this lesson plan.`,
      });
    } else if (fileContent) {
      userContent.push({
        type: "text",
        text: `Lesson plan (${fileName ?? "uploaded file"}):\n\n${fileContent}\n\nLevel: ${level}`,
      });
    } else {
      userContent.push({ type: "text", text: `Topic: ${topic}\nLevel: ${level}` });
    }

    const options = fileId ? { headers: { "anthropic-beta": "files-api-2025-04-14" } } : {};

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent as any }],
    }, options);

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const angles = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ angles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
