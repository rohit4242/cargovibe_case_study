export function speakableText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type InlinePart = { text: string; bold?: boolean };

export function inlineParts(value: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    if (match.index > last) {
      parts.push({ text: value.slice(last, match.index) });
    }
    parts.push({
      text: match[1] ?? match[2] ?? match[3] ?? "",
      bold: Boolean(match[1] || match[2]),
    });
    last = match.index + match[0].length;
  }
  if (last < value.length) {
    parts.push({ text: value.slice(last) });
  }
  return parts.filter((part) => part.text);
}
