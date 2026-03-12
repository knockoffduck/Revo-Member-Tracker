"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownPreview({ content }: { content: string }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
