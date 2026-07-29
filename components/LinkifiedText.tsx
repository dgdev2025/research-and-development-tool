"use client";

import { linkifyText } from "@/lib/linkify";

interface LinkifiedTextProps {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
}

export function LinkifiedText({
  text,
  className,
  as: Component = "p",
}: LinkifiedTextProps) {
  const parts = linkifyText(text);

  return (
    <Component className={className}>
      {parts.map((part, index) =>
        part.href ? (
          <a
            key={`link-${index}`}
            href={part.href}
            className="note-autolink"
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.text}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </Component>
  );
}
