import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function plainTextToHtml(text: string): string {
  if (!text.trim()) return "<p></p>";
  if (text.trimStart().startsWith("<")) return text;
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return (
    "<p>" +
    esc
      .split(/\n\n+/)
      .map((p) => p.replace(/\n/g, "<br/>"))
      .join("</p><p>") +
    "</p>"
  );
}

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder = "Write your journal…" }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: plainTextToHtml(value),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-neutral max-w-none min-h-[200px] px-3 py-2 text-foreground focus:outline-none [&_p]:text-foreground",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) return <div className="h-[220px] animate-pulse rounded-xl border border-input bg-muted/40" />;

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-white shadow-sm transition-shadow duration-200 ease-out focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12">
      <EditorContent editor={editor} />
    </div>
  );
}
