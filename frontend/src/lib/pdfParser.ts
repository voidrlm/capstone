import { compactSpacedLine } from "./helpers";

function extractTextOperators(streamText: string) {
  return [
    ...Array.from(streamText.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g), (match) => match[1]),
    ...Array.from(streamText.matchAll(/\[(.*?)\]\s*TJ/gs), (match) =>
      Array.from(match[1].matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g), (nested) => nested[1]).join(" "),
    ),
  ]
    .map((item) => item.replace(/\\([()\\])/g, "$1"))
    .map((item) => compactSpacedLine(item))
    .filter(Boolean);
}

export async function extractPdfText(file: File) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const pdfText = new TextDecoder("latin1").decode(buffer);
  const chunks: string[] = [];
  let searchIndex = 0;

  while (true) {
    const streamIndex = pdfText.indexOf("stream", searchIndex);
    if (streamIndex === -1) {
      break;
    }

    let contentStart = streamIndex + 6;
    if (pdfText[contentStart] === "\r" && pdfText[contentStart + 1] === "\n") {
      contentStart += 2;
    } else if (pdfText[contentStart] === "\n") {
      contentStart += 1;
    }

    const endStreamIndex = pdfText.indexOf("endstream", contentStart);
    if (endStreamIndex === -1) {
      break;
    }

    let contentEnd = endStreamIndex;
    if (pdfText[contentEnd - 2] === "\r" && pdfText[contentEnd - 1] === "\n") {
      contentEnd -= 2;
    } else if (pdfText[contentEnd - 1] === "\n") {
      contentEnd -= 1;
    }

    try {
      const rawBytes = buffer.slice(contentStart, contentEnd);
      const rawText = new TextDecoder("latin1").decode(rawBytes);
      const rawOperators = extractTextOperators(rawText);

      if (rawOperators.length > 0) {
        chunks.push(...rawOperators);
      } else {
        const decompressedStream = new Blob([rawBytes]).stream().pipeThrough(new DecompressionStream("deflate"));
        const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();
        const decompressedText = new TextDecoder("latin1").decode(decompressedBuffer);
        const decompressedOperators = extractTextOperators(decompressedText);
        if (decompressedOperators.length > 0) {
          chunks.push(...decompressedOperators);
        }
      }
    } catch {
      // Ignore non-text streams.
    }

    searchIndex = endStreamIndex + 9;
  }

  return chunks.join("\n");
}
