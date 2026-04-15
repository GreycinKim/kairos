import { cn } from "@/lib/utils";

/**
 * Magic UI–inspired moving rim light. Wrap a `relative overflow-hidden rounded-[inherit] group` container
 * and place `<BorderBeam />` as the first child so it sits under content.
 */
export function BorderBeam({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        className,
      )}
    >
      <div
        className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] origin-center animate-border-beam"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 300deg, hsl(var(--primary) / 0.42) 340deg, transparent 360deg)",
        }}
        aria-hidden
      />
    </div>
  );
}
