"use client";

import { useEffect, useRef } from "react";
import {
  linkifyToHtml,
  plainTextFromNoteElement,
} from "@/lib/linkify";

interface AutolinkNoteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AutolinkNoteInput({
  id,
  value,
  onChange,
  placeholder = "",
  className,
}: AutolinkNoteInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || focusedRef.current) return;
    if (value === lastEmittedRef.current && editor.childNodes.length > 0) return;

    editor.innerHTML = value ? linkifyToHtml(value) : "";
    editor.dataset.empty = value.trim() ? "false" : "true";
    lastEmittedRef.current = value;
  }, [value]);

  const emitPlainText = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const plain = plainTextFromNoteElement(editor);
    lastEmittedRef.current = plain;
    editor.dataset.empty = plain.trim() ? "false" : "true";
    onChange(plain);
  };

  const relinkifyPreservingEndCaret = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const plain = plainTextFromNoteElement(editor);
    lastEmittedRef.current = plain;
    onChange(plain);
    editor.innerHTML = plain ? linkifyToHtml(plain) : "";

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  return (
    <div
      ref={editorRef}
      id={id}
      role="textbox"
      aria-multiline="true"
      contentEditable
      suppressContentEditableWarning
      className={className}
      data-placeholder={placeholder}
      data-empty={value.trim() ? "false" : "true"}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        const editor = editorRef.current;
        if (!editor) return;
        const plain = plainTextFromNoteElement(editor);
        lastEmittedRef.current = plain;
        editor.dataset.empty = plain.trim() ? "false" : "true";
        onChange(plain);
        editor.innerHTML = plain ? linkifyToHtml(plain) : "";
      }}
      onInput={emitPlainText}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
        // Turn pasted URLs into real links right away.
        requestAnimationFrame(() => {
          relinkifyPreservingEndCaret();
        });
      }}
      onClick={(event) => {
        const anchor = (event.target as HTMLElement | null)?.closest("a");
        if (!anchor) return;
        event.preventDefault();
        event.stopPropagation();
        const href = anchor.getAttribute("href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          // Keep plain-text newlines instead of inserting nested divs.
          event.preventDefault();
          document.execCommand("insertLineBreak");
          emitPlainText();
        }
      }}
    />
  );
}
