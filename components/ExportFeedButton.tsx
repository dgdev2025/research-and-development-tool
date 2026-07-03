"use client";

import type { ParsedFeed } from "@/lib/parseFeed";
import { downloadMarkdown, exportFeedToMarkdown } from "@/lib/exportFeed";

interface ExportFeedButtonProps {
  feed: ParsedFeed;
  filename: string;
}

export function ExportFeedButton({ feed, filename }: ExportFeedButtonProps) {
  const handleExport = () => {
    const markdown = exportFeedToMarkdown(feed);
    downloadMarkdown(markdown, filename);
  };

  return (
    <button type="button" className="reset-btn" onClick={handleExport}>
      Export Markdown
    </button>
  );
}
