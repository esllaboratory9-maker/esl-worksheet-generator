import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { VocabItem } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { topic, level, vocabulary, exerciseNumber, exerciseType, exerciseContent, reason } =
      await req.json() as {
        topic: string;
        level: string;
        vocabulary: VocabItem[];
        exerciseNumber: number;
        exerciseType: string;
        exerciseContent: string;
        reason: string;
      };

    const vocabList = vocabulary
      .filter((v) => v.approved !== false)
      .map((v) => `${v.word} (${v.part_of_speech})`)
      .join(", ");

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: `You are an expert ESL content writer for ESL Laboratory (esllaboratory.com).

Regenerate the following exercise. Keep the topic, vocabulary list, and level unchanged. Only change what the reason asks for.

Topic: ${topic}
Level: ${level}
Vocabulary list: ${vocabList}
Exercise number: ${exerciseNumber}
Exercise type: ${exerciseType}

Original exercise:
---
${exerciseContent}
---

Reason for regeneration: ${reason}

Rules:
- Use only vocabulary from the provided vocabulary list
- Do not change the exercise type unless the reason explicitly asks for it
- Match the output format exactly to the original (same markdown structure, same answer style)
- Do not include any commentary
- The regenerated exercise must be meaningfully different from the original
- All answers must remain unambiguous and correct
- Bold answers inline, word box as blockquote if applicable
- Exercise header format: **Exercise ${exerciseNumber}** on its own line, then **[Instruction.]** on the next line

Return only the regenerated exercise in markdown, starting with:
**Exercise ${exerciseNumber}**`,
      messages: [
        {
          role: "user",
          content: `Regenerate Exercise ${exerciseNumber}. Reason: ${reason}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ markdown: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
