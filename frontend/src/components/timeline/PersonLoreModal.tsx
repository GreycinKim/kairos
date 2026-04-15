import { Modal } from "@/components/shared/Modal";
import type { PersonProfile } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";

import { PersonLorePanel } from "./PersonLorePanel";

export function PersonLoreModal({
  open,
  onClose,
  event,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  event: TimelineEvent;
  profile: PersonProfile;
}) {
  const name = profile.name || event.title;

  return (
    <Modal
      open={open}
      title={`Lore — ${name}`}
      onClose={onClose}
      wide
      dialogClassName="!max-w-[min(1600px,98vw)] max-h-[min(94vh,1200px)] border border-rose-900/15 bg-[#faf7f2] shadow-2xl"
    >
      <div className="-m-6 sm:-m-8">
        <PersonLorePanel event={event} profile={profile} onNavigateAway={onClose} />
      </div>
    </Modal>
  );
}
