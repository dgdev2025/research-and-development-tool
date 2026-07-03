export interface FeedLink {
  label: string;
  url: string;
}

export interface FeedItem {
  id: string;
  title: string;
  body: string;
  links: FeedLink[];
}

function createFeedItem(
  item: Omit<FeedItem, "id">
): FeedItem {
  return { id: crypto.randomUUID(), ...item };
}

export interface FeedSubsection {
  title: string;
  items: FeedItem[];
}

export interface FeedCategory {
  title: string;
  items: FeedItem[];
  subsections: FeedSubsection[];
  note?: string;
}

export interface ParsedFeed {
  title: string;
  meta: string[];
  categories: FeedCategory[];
  footer?: string;
}

const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

function extractLinks(text: string): { cleanText: string; links: FeedLink[] } {
  const links: FeedLink[] = [];
  const cleanText = text.replace(LINK_REGEX, (_, label: string, url: string) => {
    links.push({ label: label.trim(), url: url.trim() });
    return "";
  });
  return { cleanText: cleanText.replace(/\s+/g, " ").trim(), links };
}

function stripBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

function parseTitleFromLine(line: string): { title: string; rest: string } | null {
  const boldMatch = line.match(/^\*\*([^*]+)\*\*(.*)$/);
  if (boldMatch) {
    return {
      title: boldMatch[1].trim(),
      rest: boldMatch[2].replace(/^[.\s—–-]+/, "").trim(),
    };
  }
  return null;
}

function parseListItem(line: string): FeedItem | null {
  const trimmed = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
  if (!trimmed) return null;

  const linkedTitleMatch = trimmed.match(
    /^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*(.*)$/
  );
  if (linkedTitleMatch) {
    const rest = linkedTitleMatch[3].trim();
    const { cleanText, links } = extractLinks(rest);
    return createFeedItem({
      title: linkedTitleMatch[1].trim(),
      body: cleanText.replace(/^[—–-]\s*/, "").trim(),
      links: [
        { label: linkedTitleMatch[1].trim(), url: linkedTitleMatch[2].trim() },
        ...links,
      ],
    });
  }

  const { cleanText, links } = extractLinks(trimmed);
  const parsed = parseTitleFromLine(cleanText);

  if (parsed) {
    return createFeedItem({ title: parsed.title, body: parsed.rest, links });
  }

  if (cleanText.startsWith('"') || cleanText.includes("—")) {
    const dashSplit = cleanText.split(/\s[—–]\s/);
    if (dashSplit.length >= 2) {
      return createFeedItem({
        title: stripBold(dashSplit[0]),
        body: dashSplit.slice(1).join(" — "),
        links,
      });
    }
  }

  return createFeedItem({ title: stripBold(cleanText), body: "", links });
}

function parseBlock(block: string): FeedItem | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const first = lines[0];
  const isListItem = /^[-*]\s+/.test(first) || /^\d+\.\s+/.test(first);

  if (isListItem) {
    const item = parseListItem(first);
    if (!item) return null;
    if (lines.length > 1) {
      const extra = lines.slice(1).join(" ");
      const { cleanText, links: extraLinks } = extractLinks(extra);
      item.body = [item.body, cleanText].filter(Boolean).join(" ");
      item.links.push(...extraLinks);
    }
    return item;
  }

  const parsed = parseTitleFromLine(first);
  if (parsed) {
    const bodyLines = lines.slice(1).join(" ");
    const combined = [parsed.rest, bodyLines].filter(Boolean).join(" ");
    const { cleanText, links } = extractLinks(combined);
    return createFeedItem({ title: parsed.title, body: cleanText, links });
  }

  const { cleanText, links } = extractLinks(lines.join(" "));
  return createFeedItem({
    title: stripBold(cleanText.slice(0, 80)),
    body: cleanText,
    links,
  });
}

function splitListLines(block: string): string[] {
  const lines = block.split("\n");
  const chunks: string[] = [];
  let current: string[] = [];

  const isListStart = (line: string) =>
    /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isListStart(trimmed)) {
      if (current.length > 0) {
        chunks.push(current.join("\n"));
        current = [];
      }
      current.push(trimmed);
    } else if (current.length > 0) {
      current.push(trimmed);
    } else {
      chunks.push(trimmed);
    }
  }

  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}

function splitIntoBlocks(content: string): string[] {
  const rawBlocks = content
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b && b !== "---");

  const blocks: string[] = [];
  for (const raw of rawBlocks) {
    const lineCount = raw.split("\n").filter((l) => l.trim()).length;
    const hasMultipleListItems =
      lineCount > 1 &&
      raw.split("\n").filter((l) => /^[-*]\s+|^\d+\.\s+/.test(l.trim())).length > 1;

    if (hasMultipleListItems) {
      blocks.push(...splitListLines(raw));
    } else {
      blocks.push(raw);
    }
  }
  return blocks;
}

function parseSectionContent(content: string): {
  items: FeedItem[];
  subsections: FeedSubsection[];
  note?: string;
  footer?: string;
} {
  const items: FeedItem[] = [];
  const subsections: FeedSubsection[] = [];
  let note: string | undefined;
  let footer: string | undefined;

  const parts = content.split(/^###\s+(.+)$/m);
  if (parts.length === 1) {
    for (const block of splitIntoBlocks(content)) {
      if (block.startsWith("*") && block.endsWith("*") && !block.includes("**")) {
        const italicText = block.replace(/^\*|\*$/g, "").trim();
        if (italicText.toLowerCase().startsWith("sources:")) {
          footer = italicText;
        } else if (items.length === 0 && subsections.length === 0) {
          note = italicText;
        } else {
          footer = italicText;
        }
        continue;
      }
      const item = parseBlock(block);
      if (item && item.title) items.push(item);
    }
    return { items, subsections, note, footer };
  }

  const preamble = parts[0].trim();
  if (preamble) {
    for (const block of splitIntoBlocks(preamble)) {
      const item = parseBlock(block);
      if (item && item.title) items.push(item);
    }
  }

  for (let i = 1; i < parts.length; i += 2) {
    const subTitle = parts[i]?.trim();
    const subContent = parts[i + 1]?.trim() ?? "";
    if (!subTitle) continue;

    const subItems: FeedItem[] = [];
    for (const block of splitIntoBlocks(subContent)) {
      const item = parseBlock(block);
      if (item && item.title) subItems.push(item);
    }
    subsections.push({ title: subTitle, items: subItems });
  }

  return { items, subsections, note, footer };
}

export function parseFeedMarkdown(markdown: string): ParsedFeed {
  const lines = markdown.split("\n");
  let title = "Research Feed";
  const meta: string[] = [];
  let headerEnd = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "").trim();
      continue;
    }
    if (line.startsWith("## ")) {
      headerEnd = i;
      break;
    }
    if (line.startsWith("*") && line.endsWith("*") && !line.includes("**")) {
      meta.push(line.replace(/^\*|\*$/g, "").trim());
    }
    if (line === "---") headerEnd = i + 1;
  }

  const body = lines.slice(headerEnd).join("\n");
  const sectionParts = body.split(/^##\s+(.+)$/m);
  const categories: FeedCategory[] = [];
  let footer: string | undefined;

  for (let i = 1; i < sectionParts.length; i += 2) {
    const sectionTitle = sectionParts[i]?.trim();
    const sectionContent = sectionParts[i + 1]?.trim() ?? "";
    if (!sectionTitle) continue;

    const { items, subsections, note, footer: sectionFooter } =
      parseSectionContent(sectionContent);
    if (sectionFooter) footer = sectionFooter;
    categories.push({
      title: sectionTitle,
      items,
      subsections,
      note,
    });
  }

  return { title, meta, categories, footer };
}
