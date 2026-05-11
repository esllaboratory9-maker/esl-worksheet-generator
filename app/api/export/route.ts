import { NextRequest, NextResponse } from "next/server";
import { generateDocx } from "@/lib/docxExport";
import { toStudentMarkdown } from "@/lib/parseExercises";

export async function POST(req: NextRequest) {
  try {
    const { markdown, version } = await req.json() as {
      markdown: string;
      version: "teacher" | "student";
    };

    const content = version === "student" ? toStudentMarkdown(markdown) : markdown;
    const buffer = await generateDocx(content);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="esl-worksheet-${version}.docx"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
