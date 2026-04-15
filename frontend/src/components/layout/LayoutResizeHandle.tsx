import { PanelResizeHandle } from "react-resizable-panels";

import clsx from "clsx";

type Props = { className?: string };

export function LayoutResizeHandle({ className }: Props) {
  return (
    <PanelResizeHandle
      hitAreaMargins={{ coarse: 12, fine: 6 }}
      className={clsx(
        "group relative w-1.5 shrink-0 bg-neutral-300/90 outline-none transition-colors hover:bg-amber-400/55 focus-visible:bg-amber-400/55 data-[resize-handle-state=drag]:bg-amber-400/70",
        className,
      )}
    >
      <span
        className="absolute inset-y-0 left-1/2 hidden w-[max(100%,0.375rem)] -translate-x-1/2 sm:block"
        aria-hidden
      />
    </PanelResizeHandle>
  );
}
