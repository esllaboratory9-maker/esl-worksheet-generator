import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { exerciseType, exerciseContent, level } = await req.json() as {
      exerciseType: string;
      exerciseContent: string;
      level: string;
    };

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: `You are reviewing an ESL exercise for ${level} learners.

Here is the exercise:
---
${exerciseContent}
---

The exercise type is: ${exerciseType}

Suggest exactly 4 specific reasons why a teacher might want to regenerate this exercise. Reasons must be concrete and actionable — not generic. Each reason should describe a meaningful change: difficulty, format, support level, content, or structure.

Think about what could genuinely be improved or changed about this specific exercise given its type and level.

Examples by type (use as inspiration, not a fixed list):
- Matching (word → definition): make definitions simpler/harder, add more plausible distractors, reduce items, change matching type
- Gap fill with word box: remove word box to make it harder, rewrite sentences to be more natural, reduce items
- Gap fill without word box: add a word box for support, rewrite to reduce ambiguity
- Odd one out: make categories less obvious, make the odd word more surprising, simplify categories
- Complete the text: shorten the passage, spread blanks more evenly, change text genre
- Complete the dialogue: make it more natural, add a second dialogue, change the situation
- Choose the correct word: make options harder to distinguish, focus on collocations
- Highlight the correct option: make incorrect statements less obviously wrong, add more pairs
- Collocations matching: add more verb options, make noun phrases more specific
- Categorise the words: add more categories, make categories less obvious

Return a JSON array of exactly 4 strings. No other text.
["reason 1", "reason 2", "reason 3", "reason 4"]`,
      messages: [{ role: "user", content: "Generate 4 regeneration reasons for this exercise." }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");

    const reasons = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ reasons });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
