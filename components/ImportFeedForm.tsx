"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseFeedMarkdown } from "@/lib/parseFeed";
import { createFeed } from "@/lib/feeds";

interface ImportFeedFormProps {
  userId: string;
}

export function ImportFeedForm({ userId }: ImportFeedFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    if (!selected.name.endsWith(".md") && !selected.name.endsWith(".markdown")) {
      setError("Please upload a .md or .markdown file.");
      return;
    }
    setFile(selected);
    setError(null);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a title for this feed.");
      return;
    }
    if (!file) {
      setError("Please choose a markdown file.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const parsed = parseFeedMarkdown(content);

      if (parsed.categories.length === 0) {
        setError("No categories found. Make sure the file uses ## headings for sections.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const feed = await createFeed(supabase, title.trim(), parsed, userId);
      router.push(`/feeds/${feed.id}`);
      router.refresh();
    } catch {
      setError("Failed to import feed. Check your Supabase connection and permissions.");
      setLoading(false);
    }
  };

  return (
    <div className="import-form">
      {error && <div className="error-msg">{error}</div>}

      <label className="field-label">
        Feed title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Week 26 Research Feed"
          className="text-input"
        />
      </label>

      <div
        className={`upload-zone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".md,.markdown,text/markdown"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="upload-label"
          onClick={() => inputRef.current?.click()}
        >
          Choose Markdown File
        </button>
        <p className="upload-hint">or drag and drop your .md file here</p>
        {file && <p className="file-name">{file.name}</p>}
      </div>

      <button
        type="button"
        className="submit-btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Importing..." : "Import Feed"}
      </button>
    </div>
  );
}
