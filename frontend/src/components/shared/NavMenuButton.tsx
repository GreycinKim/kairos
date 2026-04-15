import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";

/** Opens the main navigation when the sidebar is collapsed. */
export function NavMenuButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open navigation menu"
      className={cn(
        "fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-foreground shadow-float backdrop-blur-xl transition-all duration-200 ease-out hover:bg-white hover:shadow-card active:scale-[0.97]",
        className,
      )}
    >
      <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
