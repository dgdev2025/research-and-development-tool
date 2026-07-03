"use client";

import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
  onProcess: (content: string) => void;
  error: string | null;
}

export function FileUpload({ onProcess, error }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    if (!selected.name.endsWith(".md") && !selected.name.endsWith(".markdown")) {
      return;
    }
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      handleFile(dropped ?? null);
    },
    [handleFile]
  );

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    const content = await file.text();
    onProcess(content);
  }, [file, onProcess]);

  return (
    <>
      {error && <div className="error-msg">{error}</div>}

      <div
        className={`upload-zone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
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

        {file && (
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <button type="button" className="submit-btn" onClick={handleSubmit}>
              Process Feed
            </button>
          </div>
        )}
      </div>
    </>
  );
}
