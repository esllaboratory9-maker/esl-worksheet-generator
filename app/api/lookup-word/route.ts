import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { word, level } = await req.json() as { word: string; level: string };

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: `You are a vocabulary specialist for ESL Laboratory (esllaboratory.com).

A teacher wants to add a specific word or phrase to a ${level} vocabulary worksheet.

Given the word or phrase, provide:
- word — the word/phrase exactly as given
- definition — a clear definition written at the ${level} level (do not use the word in its own definition)
- example — one natural example sentence
- part_of_speech — e.g. noun, verb, adjective, adverb, phrase, idiom, collocation

Level guidance:
- A1–A2: very short definitions (5–8 words), simple sentences
- A2–B1: short definitions (8–12 words), medium sentences
- B1–B2: fuller definitions (10–15 words), natural sentences
- B2–C1: precise definitions (12–18 words), authentic register

Return a single JSON object only. No other text.
{ "word": "...", "definition": "...", "example": "...", "part_of_speech": "..." }`,
      messages: [{ role: "user", content: `Word/phrase: ${word}` }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const item = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
