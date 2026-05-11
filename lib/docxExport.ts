import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
  convertInchesToTwip,
  PageOrientation,
} from "docx";

const FONT = "Helvetica Neue";
const FONT_SIZE = 26; // half-points: 13pt = 26

function parseInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: FONT,
          size: FONT_SIZE,
        })
      );
    } else if (part) {
      runs.push(
        new TextRun({
          text: part,
          font: FONT,
          size: FONT_SIZE,
        })
      );
    }
  }
  return runs;
}

function markdownToParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine;

    // Empty line
    if (line.trim() === "") {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "", font: FONT, size: FONT_SIZE })],
          spacing: { after: 80 },
        })
      );
      continue;
    }

    // Full-line bold (exercise header or instruction)
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      const text = line.trim().replace(/^\*\*|\*\*$/g, "");
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              font: FONT,
              size: FONT_SIZE,
            }),
          ],
          spacing: { after: 80 },
        })
      );
      continue;
    }

    // Word box (blockquote > ...)
    if (line.trim().startsWith(">")) {
      const text = line.trim().replace(/^>\s*/, "");
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              font: FONT,
              size: FONT_SIZE,
            }),
          ],
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
          },
          spacing: { after: 80, before: 80 },
          indent: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
        })
      );
      continue;
    }

    // Regular line with possible inline bold
    paragraphs.push(
      new Paragraph({
        children: parseInlineRuns(line),
        spacing: { after: 60 },
      })
    );
  }

  return paragraphs;
}

export async function generateDocx(markdown: string): Promise<Uint8Array> {
  const paragraphs = markdownToParagraphs(markdown);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27), // A4
              height: convertInchesToTwip(11.69),
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
