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

export type ChatListItem = {
  title: string;
  detail?: string;
};

export type ChatBlock =
  | { type: "text"; text: string }
  | { type: "list"; items: ChatListItem[] };

function itemFromChunk(chunk: string): ChatListItem {
  const cleaned = chunk.replace(/^\d+\.\s*/, "").replace(/\s+/g, " ").trim().replace(/[.;]$/, "");
  const driver = cleaned.match(/Driver:\s*([^,]+)/i)?.[1]?.trim();
  const plate = cleaned.match(/Plate:\s*([^,]+)/i)?.[1]?.trim();
  const times = cleaned.match(/Times:\s*([^,]+?)(?:,\s*ID:|$)/i)?.[1]?.trim();

  if (driver) {
    return {
      title: driver,
      detail: [plate, times].filter(Boolean).join("  ·  "),
    };
  }

  return { title: cleaned };
}

export function parseChatBlocks(value: string): ChatBlock[] {
  const text = value.trim();
  if (!text) {
    return [];
  }

  const pieces = text.split(/(?=\s*\d+\.\s+)/);
  const items = pieces
    .filter((piece) => /^\s*\d+\.\s+/.test(piece))
    .map((piece) => itemFromChunk(piece.trim()));

  if (items.length < 2) {
    return [{ type: "text", text }];
  }

  const intro = pieces[0]?.replace(/:\s*$/, "").trim();
  const blocks: ChatBlock[] = [];
  if (intro && !/^\d+\.\s+/.test(intro)) {
    blocks.push({ type: "text", text: intro.replace(/:\s*$/, "") });
  }
  blocks.push({ type: "list", items });
  return blocks;
}
