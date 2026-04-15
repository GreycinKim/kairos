import type { AtlasMapPin } from "@/lib/mapAtlasTypes";
import type {
  FamilyLink,
  LoreCallout,
  LoreCard,
  PersonFigureKind,
  PersonProfile,
  ScriptureAppearance,
} from "@/lib/timelinePeople";

type ScopeAlias = PersonProfile["scope"] | "OT" | "NT";

export type PeoplePackTimelineEvent = {
  title: string;
  type: string;
  start_year?: number | null;
  end_year?: number | null;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  era?: string | null;
  author?: string | null;
  written_start_year?: number | null;
  written_end_year?: number | null;
};

export type ExternalFamilyLinkType =
  | "spouse"
  | "parent"
  | "childof"
  | "siblingof"
  | "ancestorof"
  | "concubine"
  | "step_parent"
  | "step_son"
  | "step_daughter"
  | "step_brother"
  | "step_sister"
  | "cousin"
  | "step_cousin";

export type PeoplePackExternalFamilyLink = {
  type: ExternalFamilyLinkType | (string & {});
  targetEventId: string;
};

export type PeoplePackProfile = Partial<PersonProfile> & {
  name: string;
  scope: ScopeAlias;
  figureKind?: PersonFigureKind;
  title?: string;
  biography?: string;
  diedYear?: number | null;
  ruledFromYear?: number | null;
  ruledToYear?: number | null;
  hidden?: boolean;
  scriptureAppearances?: ScriptureAppearance[];
  loreCards?: LoreCard[];
  loreCallouts?: LoreCallout[];
  relatedEventIds?: string[];
  imageDataUrl?: string | null;
  atlasPin?: AtlasMapPin | null;
  familyLinks?: FamilyLink[] | PeoplePackExternalFamilyLink[];
};

/** Canonical shape: timeline_event + profile. */
export type PeoplePackCanonicalRow = {
  slug: string;
  eventId?: string;
  timeline_event: PeoplePackTimelineEvent;
  profile: PeoplePackProfile;
  familyLinks?: PeoplePackExternalFamilyLink[];
};

/** Flat shape: importer derives profile + timeline_event from top-level fields. */
export type PeoplePackFlatRow = {
  slug?: string;
  eventId: string;
  name: string;
  scope?: ScopeAlias;
  figureKind?: PersonFigureKind;
  title?: string;
  biography?: string;
  diedYear?: number | null;
  ruledFromYear?: number | null;
  ruledToYear?: number | null;
  hidden?: boolean;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  era?: string | null;
  author?: string | null;
  written_start_year?: number | null;
  written_end_year?: number | null;
  scriptureAppearances?: ScriptureAppearance[];
  loreCards?: LoreCard[];
  loreCallouts?: LoreCallout[];
  relatedEventIds?: string[];
  imageDataUrl?: string | null;
  atlasPin?: AtlasMapPin | null;
  familyLinks?: PeoplePackExternalFamilyLink[];
};

export type PeoplePackRow = PeoplePackCanonicalRow | PeoplePackFlatRow;

export type PeoplePackJson = {
  __readme__?: string;
  source?: string;
  people: PeoplePackRow[] | unknown[];
};

