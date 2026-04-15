import { Link } from "react-router-dom";

import { Modal } from "@/components/shared/Modal";
import type { FamilyLinkRelation, PersonProfile } from "@/lib/timelinePeople";
import { loadPeopleProfiles } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";
import { useTimelineStore } from "@/store/timelineStore";

const REL_LABEL: Record<FamilyLinkRelation, string> = {
  parent: "Parent",
  child: "Child",
  spouse: "Spouse",
  sibling: "Sibling",
  other: "Related",
};

function PersonMiniCard({
  ev,
  profile,
  relation,
}: {
  ev: TimelineEvent;
  profile: PersonProfile | null;
  relation?: string;
}) {
  const name = profile?.name ?? ev.title;
  return (
    <div className="flex w-[min(100%,200px)] flex-col items-center rounded-xl border border-rose-900/15 bg-white p-3 text-center shadow-sm">
      {profile?.imageDataUrl ? (
        <img src={profile.imageDataUrl} alt="" className="h-16 w-16 rounded-full border object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-neutral-100 text-2xl">{ev.icon ?? "👤"}</div>
      )}
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-900">{name}</p>
      {relation ? <p className="text-[10px] font-medium uppercase tracking-wide text-rose-800/80">{relation}</p> : null}
      <Link to={`/timeline/person/${ev.id}`} className="mt-2 text-[11px] font-medium text-rose-900 underline-offset-2 hover:underline">
        Open lore
      </Link>
    </div>
  );
}

export function PersonFamilyTreeModal({
  open,
  onClose,
  centerEvent,
  centerProfile,
}: {
  open: boolean;
  onClose: () => void;
  centerEvent: TimelineEvent;
  centerProfile: PersonProfile;
}) {
  const events = useTimelineStore((s) => s.events);
  const links = centerProfile.familyLinks ?? [];
  const profiles = typeof window !== "undefined" ? loadPeopleProfiles() : {};

  const resolve = (id: string) => {
    const ev = events.find((e) => e.id === id && (e.type === "person" || e.type === "ruler"));
    if (!ev) return null;
    const prof = profiles[id] ?? null;
    return { ev, profile: prof };
  };

  const parents = links
    .filter((l) => l.relation === "parent")
    .map((l) => resolve(l.personEventId))
    .filter(Boolean) as { ev: TimelineEvent; profile: PersonProfile | null }[];
  const children = links
    .filter((l) => l.relation === "child")
    .map((l) => resolve(l.personEventId))
    .filter(Boolean) as { ev: TimelineEvent; profile: PersonProfile | null }[];
  const spouses = links
    .filter((l) => l.relation === "spouse")
    .map((l) => resolve(l.personEventId))
    .filter(Boolean) as { ev: TimelineEvent; profile: PersonProfile | null }[];
  const siblings = links
    .filter((l) => l.relation === "sibling" || l.relation === "other")
    .map((l) => resolve(l.personEventId))
    .filter(Boolean) as {
    ev: TimelineEvent;
    profile: PersonProfile | null;
  }[];

  const hasAny = parents.length + children.length + spouses.length + siblings.length > 0;

  return (
    <Modal open={open} title="Family tree" onClose={onClose} wide dialogClassName="!max-w-[min(900px,96vw)] max-h-[min(88vh,900px)]">
      {!hasAny ? (
        <p className="text-sm text-muted-foreground">
          No family links yet. Use <strong>Edit profile</strong> → Family links to connect parents, children, or spouses.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-8 py-2">
          {parents.length > 0 ? (
            <div>
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Parents</p>
              <div className="flex flex-wrap justify-center gap-4">
                {parents.map(({ ev, profile }) => (
                  <PersonMiniCard key={ev.id} ev={ev} profile={profile} relation={REL_LABEL.parent} />
                ))}
              </div>
              <div className="mx-auto mt-4 h-6 w-px bg-rose-900/25" />
            </div>
          ) : null}

          <div className="flex flex-wrap items-end justify-center gap-4">
            {spouses.map(({ ev, profile }) => (
              <PersonMiniCard key={ev.id} ev={ev} profile={profile} relation={REL_LABEL.spouse} />
            ))}
            <PersonMiniCard ev={centerEvent} profile={centerProfile} relation="This person" />
          </div>

          {siblings.length > 0 ? (
            <div>
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Siblings &amp; other</p>
              <div className="flex flex-wrap justify-center gap-4">
                {siblings.map(({ ev, profile }, i) => {
                  const link = links.find((l) => l.personEventId === ev.id);
                  const rel = link?.relation === "other" ? "Related" : REL_LABEL[link?.relation ?? "sibling"];
                  return <PersonMiniCard key={`${ev.id}-${i}`} ev={ev} profile={profile} relation={rel} />;
                })}
              </div>
            </div>
          ) : null}

          {children.length > 0 ? (
            <div>
              <div className="mx-auto mb-4 h-6 w-px bg-rose-900/25" />
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Children</p>
              <div className="flex flex-wrap justify-center gap-4">
                {children.map(({ ev, profile }) => (
                  <PersonMiniCard key={ev.id} ev={ev} profile={profile} relation={REL_LABEL.child} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
