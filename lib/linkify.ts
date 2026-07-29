export type LinkPart = {
  text: string;
  href?: string;
};

const URL_REGEX =
  /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?"')\]])/gi;

export function normalizeHttpHref(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function linkifyText(text: string): LinkPart[] {
  if (!text) return [];

  const parts: LinkPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    const rawUrl = match[0];
    const index = match.index ?? 0;
    const href = normalizeHttpHref(rawUrl);

    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index) });
    }

    if (href) {
      parts.push({ text: rawUrl, href });
    } else {
      parts.push({ text: rawUrl });
    }

    lastIndex = index + rawUrl.length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ text }];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build safe HTML for a contentEditable note (links open in a new tab). */
export function linkifyToHtml(text: string): string {
  if (!text) return "";

  return linkifyText(text)
    .map((part) => {
      const escaped = escapeHtml(part.text).replace(/\n/g, "<br>");
      if (!part.href) return escaped;
      return `<a href="${escapeHtml(part.href)}" class="note-autolink" target="_blank" rel="noopener noreferrer">${escaped}</a>`;
    })
    .join("");
}

export function plainTextFromNoteElement(element: HTMLElement): string {
  return (element.innerText ?? "").replace(/\u00a0/g, " ");
}
