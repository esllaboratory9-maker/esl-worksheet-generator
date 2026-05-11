import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, level, fileContent, fileBase64, fileType, fileName } = body as {
      topic?: string;
      level: string;
      fileContent?: string;
      fileBase64?: string;
      fileType?: string;
      fileName?: string;
    };

    const isPdf = fileType === "application/pdf" && !!fileBase64;
    const isFileMode = isPdf || !!fileContent;

    const systemPrompt = isFileMode
      ? `You are a curriculum designer for ESL Laboratory (esllaboratory.com), a site that publishes vocabulary worksheets for adult and teenage ESL learners.

A teacher has uploaded a lesson plan and wants to create a vocabulary worksheet for ${level} learners.

Generate exactly 5 worksheet angles based on the lesson plan content. Each angle is a specific lens through which the topic can be explored as a vocabulary worksheet — not a lesson plan, not a discussion topic, just a focused vocabulary angle.

For each angle provide:
- title — a short, specific worksheet title (as it would appear on the site)
- description — one sentence explaining what vocabulary this worksheet covers and why it suits this level
- vocabulary_type — the kind of vocabulary this angle focuses on (e.g. nouns, collocations, idioms, adjectives, verbs, fixed phrases, grammar rules)

Rules:
- Each angle must be genuinely distinct — different vocabulary, different vocabulary type, or a different aspect of the topic
- Angles must be realistic and teachable at the specified level
- Titles must be specific enough that a teacher immediately knows what vocabulary is in the worksheet
- Do not suggest angles that would overlap significantly in vocabulary
- If the lesson plan focuses on grammar, at least one angle may be grammar-focused

Return a JSON array. No other text before or after it.
[{ "title": "...", "description": "...", "vocabulary_type": "..." }]`
      : `You are a curriculum designer for ESL Laboratory (esllaboratory.com), a site that publishes vocabulary worksheets for adult and teenage ESL learners.

A teacher wants to create a vocabulary worksheet on the topic of ${topic} for ${level} learners.

Generate exactly 5 worksheet angles for this topic and level. Each angle is a specific lens through which the topic can be explored as a vocabulary worksheet — not a lesson plan, not a discussion topic, just a focused vocabulary angle.

For each angle provide:
- title — a short, specific worksheet title (as it would appear on the site, e.g. "Easter Food Vocabulary — Hot Cross Buns, Lamb & More")
- description — one sentence explaining what vocabulary this worksheet covers and why it suits this level
- vocabulary_type — the kind of vocabulary this angle focuses on (e.g. nouns, collocations, idioms, adjectives, verbs, fixed phrases)

Rules:
- Each angle must be genuinely distinct — different vocabulary, different vocabulary type, or a different aspect of the topic
- Angles must be realistic and teachable at the specified level — do not suggest idioms at A1, do not suggest basic nouns at C1
- Titles must be specific enough that a teacher immediately knows what vocabulary is in the worksheet
- Do not suggest angles that would overlap significantly in vocabulary
- Do not include grammar-focused angles — vocabulary only

Return a JSON array. No other text before or after it.
[{ "title": "...", "description": "...", "vocabulary_type": "..." }]`;

    // Build the user message content
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

    const userContent: ContentBlock[] = [];

    if (isPdf) {
      userContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: fileBase64!,
        },
      });
      userContent.push({
        type: "text",
        text: `This is the lesson plan (file: ${fileName ?? "lesson plan"}). Level: ${level}.\n\nGenerate 5 worksheet angles based on this lesson plan.`,
      });
    } else if (fileContent) {
      userContent.push({
        type: "text",
        text: `Lesson plan (${fileName ?? "uploaded file"}):\n\n${fileContent}\n\nLevel: ${level}\n\nGenerate 5 worksheet angles based on this lesson plan.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Topic: ${topic}\nLevel: ${level}`,
      });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: "user", content: userContent as any }],
    });

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
