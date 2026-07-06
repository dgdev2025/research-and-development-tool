import type { FeedItem, FeedLink, ParsedFeed } from "./parseFeed";

function formatLinks(links: FeedLink[]): string {
  if (links.length === 0) return "";
  return ` (${links.map((link) => `[${link.label}](${link.url})`).join(" · ")})`;
}

function exportItem(item: FeedItem, asBullet = false): string {
  const links = formatLinks(item.links);

  if (asBullet) {
    const body = item.body ? ` ${item.body}` : "";
    return `- **${item.title}.**${body}${links}`;
  }

  if (item.body) {
    return `**${item.title}**\n${item.body}${links}`;
  }

  return `**${item.title}**${links}`;
}

function exportItems(items: FeedItem[], asBullets = false): string {
  return items.map((item) => exportItem(item, asBullets)).join("\n\n");
}

export function exportFeedToMarkdown(feed: ParsedFeed): string {
  const lines: string[] = [`# ${feed.title}`];

  for (const metaLine of feed.meta) {
    lines.push(`*${metaLine}*`);
  }

  lines.push("", "---", "");

  if (feed.note?.trim()) {
    lines.push(`> ${feed.note.trim().replace(/\n/g, "\n> ")}`, "");
  }

  feed.categories.forEach((category, index) => {
    lines.push(`## ${category.title}`, "");

    if (category.note) {
      lines.push(`*${category.note}*`, "");
    }

    if (category.items.length > 0) {
      const useBullets = category.title.toLowerCase().includes("top stories");
      lines.push(exportItems(category.items, useBullets), "");
    }

    for (const subsection of category.subsections) {
      lines.push(`### ${subsection.title}`, "");
      lines.push(exportItems(subsection.items, true), "");
    }

    if (index < feed.categories.length - 1) {
      lines.push("---", "");
    }
  });

  if (feed.footer) {
    lines.push("", `*${feed.footer}*`);
  }

  return lines.join("\n").trim() + "\n";
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
