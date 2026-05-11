export interface Angle {
  title: string;
  description: string;
  vocabulary_type: string;
}

export interface VocabItem {
  word: string;
  definition: string;
  example: string;
  part_of_speech: string;
  source_example?: string; // sentence from the uploaded lesson plan
  approved?: boolean;
  id?: string;
}

export interface Exercise {
  number: number;
  type: string;
  content: string;
}

export type InputMode = "topic" | "file";

export interface AppState {
  step: 1 | 2 | 3 | 4 | 5;
  inputMode: InputMode;
  topic: string;
  level: string;
  fileContent?: string;   // plain text for .txt/.docx
  fileBase64?: string;    // base64 for PDFs
  fileType?: string;      // MIME type
  fileName?: string;
  selectedAngles: Angle[];
  vocabulary: VocabItem[];
  worksheetMarkdown: string;
  exercises: Exercise[];
}
