import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-markdown-preview/markdown.css";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

function wikiToMarkdown(md: string): string {
  return md.replace(/\[\[([^\]]+)]]/g, (_m, title: string) => {
    const t = String(title).trim();
    return `[${t}](/notes?highlight=${encodeURIComponent(t)})`;
  });
}

interface MarkdownRendererProps {
  source: string;
  className?: string;
}

export function MarkdownRenderer({ source, className }: MarkdownRendererProps) {
  const processed = useMemo(() => wikiToMarkdown(source || ""), [source]);
  return (
    <div data-color-mode="light" className={cn("prose prose-sm max-w-none text-foreground", className)}>
      <MDEditor.Markdown source={processed} />
    </div>
  );
}
