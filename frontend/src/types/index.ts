export type TimelineEventType =
  | "bible_book"
  | "empire"
  | "ruler"
  | "person"
  | "journal"
  | "milestone";

export interface TimelineEvent {
  id: string;
  title: string;
  type: TimelineEventType;
  start_year: number | null;
  end_year: number | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  era: string | null;
  author: string | null;
  written_start_year: number | null;
  written_end_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface Theme {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  event_id: string;
  title: string | null;
  body: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  themes: Theme[];
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  title: string | null;
  body: string | null;
  prayer_requests: string | null;
  answered_prayers: string | null;
  tags: string[] | null;
  linked_event_id: string | null;
  created_at: string;
  themes: Theme[];
}

export interface WordStudy {
  id: string;
  word: string;
  transliteration: string | null;
  language: string | null;
  strongs_number: string | null;
  definition: string | null;
  extended_notes: string | null;
  verse_references: string[] | null;
  created_at: string;
}

export interface Prayer {
  id: string;
  title: string;
  body: string | null;
  status: string | null;
  prayed_on: string;
  answered_on: string | null;
  answer_notes: string | null;
  linked_event_id: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface ScriptureFlowFolder {
  id: string;
  title: string;
  created_at: string;
}

export interface ScriptureFlowMap {
  id: string;
  title: string;
  notes_markdown: string;
  graph_json: { nodes: unknown[]; edges: unknown[] };
  folder_id: string | null;
  updated_at: string;
}

export interface FlowMapVerseMention {
  map_id: string;
  map_title: string;
  span_label: string;
}

export interface FlowMapEdgeHit {
  map_id: string;
  map_title: string;
  ref_label: string;
  kind: string;
}

export interface FlowMapVerseRollup {
  in_maps: FlowMapVerseMention[];
  leads_to: FlowMapEdgeHit[];
  led_from: FlowMapEdgeHit[];
}

export interface FlowMapChapterIndexResponse {
  verses: Record<string, FlowMapVerseRollup>;
}

export interface ScriptureLink {
  id: string;
  source_type: string;
  source_id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  translation: string | null;
  created_at: string;
}

export interface SearchHit {
  id: string;
  type: string;
  title: string;
  snippet: string | null;
  route_hint: string;
}

export type ZoomLevel = "millennium" | "century" | "decade" | "year" | "detail";

export interface EraBand {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  tint: string;
}

export interface JbchLink {
  text: string;
  href: string;
}

export interface JbchPageSlice {
  source_url: string;
  requires_auth: boolean;
  links: JbchLink[];
  text_blocks: string[];
}

export interface JbchRecitationCard {
  title: string;
  reference: string;
  text: string;
}

export interface JbchHubRead {
  fetched_at: string | null;
  note: string | null;
  index: JbchPageSlice;
  dictionary: JbchPageSlice;
  recitation_page: JbchPageSlice;
  recitation_cards: JbchRecitationCard[];
}

export interface ChapterVerseRow {
  verse: number;
  text: string;
  /** LSB: study section heading split from `text` for cleaner layout */
  section_title?: string | null;
}

export interface ChapterTextResponse {
  reference: string;
  translation: string;
  book: string;
  chapter: number;
  verses: ChapterVerseRow[];
}

export interface ReaderHighlightRead {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  start_offset: number;
  end_offset: number;
  color: string;
  highlighted_text: string | null;
  created_at: string;
}

export interface ReaderVerseNoteRead {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  body: string;
  created_at: string;
  updated_at: string;
}
