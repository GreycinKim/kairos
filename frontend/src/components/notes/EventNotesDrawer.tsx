import { EventNotesWorkspace } from "@/components/timeline/EventNotesWorkspace";
import type { TimelineEvent } from "@/types";

export function EventNotesDrawer({
  event,
  deepDivePath,
  onDeleteEvent,
  onClose,
  eventImageUrl,
  onEventImageChange,
}: {
  event: TimelineEvent;
  deepDivePath?: string | null;
  onDeleteEvent?: (eventId: string) => Promise<void> | void;
  onClose: () => void;
  eventImageUrl?: string | null;
  onEventImageChange?: (dataUrl: string | null) => void;
}) {
  return (
    <aside className="glass-surface-strong fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col shadow-sheet transition-transform duration-300 ease-out animate-in slide-in-from-right-4">
      <EventNotesWorkspace
        event={event}
        deepDivePath={deepDivePath}
        onDeleteEvent={onDeleteEvent}
        eventImageUrl={eventImageUrl}
        onEventImageChange={onEventImageChange}
        headerEnd={
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-black/[0.06] hover:text-foreground"
            aria-label="Close drawer"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        }
      />
    </aside>
  );
}
