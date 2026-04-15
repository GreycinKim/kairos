import { Fragment } from "react";
import { Link } from "react-router-dom";

import { Modal } from "@/components/shared/Modal";
import type { FamilyLinkRelation, PersonProfile } from "@/lib/timelinePeople";
import { FAMILY_RELATION_LABEL, loadPeopleProfiles } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";
import { useTimelineStore } from "@/store/timelineStore";

function relationLabel(relation: string): string {
  return FAMILY_RELATION_LABEL[relation as FamilyLinkRelation] ?? relation;
}

function HBar() {
  return <div className="h-0.5 w-10 shrink-0 self-center bg-rose-900/35" aria-hidden />;
}

function VBar({ className = "h-10" }: { className?: string }) {
  return <div className={`mx-auto w-px shrink-0 bg-rose-900/25 ${className}`} aria-hidden />;
}

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

function SideBySideRow({
  title,
  nodes,
  getRelation,
}: {
  title: string;
  nodes: { ev: TimelineEvent; profile: PersonProfile | null }[];
  getRelation: (ev: TimelineEvent) => string;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="flex w-full flex-col items-center">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
      <div className="flex flex-wrap items-center justify-center gap-y-3">
        {nodes.map(({ ev, profile }, idx) => (
          <Fragment key={ev.id}>
            {idx > 0 ? <HBar /> : null}
            <PersonMiniCard ev={ev} profile={profile} relation={getRelation(ev)} />
          </Fragment>
        ))}
      </div>
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

  const byRelation = (rels: FamilyLinkRelation[]) =>
    links
      .filter((l) => rels.includes(l.relation))
      .map((l) => resolve(l.personEventId))
      .filter(Boolean) as { ev: TimelineEvent; profile: PersonProfile | null }[];

  const parents = byRelation(["parent"]);
  const stepParents = byRelation(["step_parent"]);
  const spouses = byRelation(["spouse"]);
  const concubines = byRelation(["concubine"]);
  const children = byRelation(["child"]);
  const stepChildren = byRelation(["step_son", "step_daughter"]);
  const extendedPeers = byRelation(["sibling", "step_brother", "step_sister", "cousin", "step_cousin", "other"]);

  const relFor = (ev: TimelineEvent) => {
    const link = links.find((l) => l.personEventId === ev.id);
    return link ? relationLabel(link.relation) : "";
  };

  const partnerNodes = [...spouses, ...concubines];
  const hasAny =
    parents.length +
      stepParents.length +
      partnerNodes.length +
      children.length +
      stepChildren.length +
      extendedPeers.length >
    0;

  return (
    <Modal open={open} title="Family tree" onClose={onClose} wide dialogClassName="!max-w-[min(960px,96vw)] max-h-[min(88vh,900px)]">
      {!hasAny ? (
        <p className="text-sm text-muted-foreground">
          No family links yet. Use <strong>Edit profile</strong> → Family links to connect parents, children, spouses, concubines, step
          family, cousins, and more.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6 py-2">
          <SideBySideRow title="Parents" nodes={parents} getRelation={relFor} />
          {parents.length > 0 ? <VBar /> : null}

          {stepParents.length > 0 ? (
            <>
              <SideBySideRow title="Step-parents" nodes={stepParents} getRelation={relFor} />
              <VBar />
            </>
          ) : null}

          <div className="flex w-full flex-col items-center">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">You &amp; partners</p>
            <div className="flex flex-wrap items-center justify-center gap-y-3">
              {partnerNodes.map(({ ev, profile }, idx) => (
                <Fragment key={ev.id}>
                  {idx > 0 ? <HBar /> : null}
                  <PersonMiniCard ev={ev} profile={profile} relation={relFor(ev)} />
                </Fragment>
              ))}
              {partnerNodes.length > 0 ? <HBar /> : null}
              <PersonMiniCard ev={centerEvent} profile={centerProfile} relation="This person" />
            </div>
          </div>

          {extendedPeers.length > 0 ? (
            <>
              <VBar />
              <SideBySideRow title="Siblings &amp; extended family" nodes={extendedPeers} getRelation={relFor} />
            </>
          ) : null}

          {children.length > 0 || stepChildren.length > 0 ? <VBar /> : null}

          <SideBySideRow title="Children" nodes={children} getRelation={relFor} />

          {stepChildren.length > 0 ? (
            <>
              {children.length > 0 ? <div className="h-6" /> : null}
              <SideBySideRow title="Step-children" nodes={stepChildren} getRelation={relFor} />
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
