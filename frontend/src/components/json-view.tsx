import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function JsonView({ data, defaultOpen = true }: { data: unknown; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Скопировано в буфер");
  };

  return (
    <div className="rounded-lg border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="h-6 px-1.5 text-muted-foreground"
        >
          {open ? <ChevronUp /> : <ChevronDown />}
          JSON
        </Button>
        <Button variant="ghost" size="sm" onClick={copy} className="h-6 px-1.5 text-muted-foreground">
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      {open && (
        <pre className="max-h-80 overflow-auto p-3 text-xs text-foreground/90 whitespace-pre-wrap break-words">
          {text}
        </pre>
      )}
    </div>
  );
}