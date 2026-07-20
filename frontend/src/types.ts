export type Layout = "title" | "section" | "bullets" | "two_column";

export interface SlideIn {
  id?: string | null;
  position: number;
  layout: Layout;
  title?: string;
  body?: Record<string, unknown>;
}

export interface SlideOut {
  id: string;
  project_id: string;
  position: number;
  layout: Layout;
  title: string;
  body: Record<string, unknown>;
}

export interface OutlineItem {
  title: string;
  intent: string;
}

export interface ProjectOut {
  id: string;
  title: string;
  raw_notes: string;
  expanded_notes: string;
  outline: OutlineItem[];
  created_at: string;
  updated_at: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  updated_at: string;
  has_expanded: boolean;
  has_slides: boolean;
}

export interface ProjectDetail {
  project: ProjectOut;
  slides: SlideOut[];
}

export interface ExpandResult {
  project: ProjectOut;
  expanded_notes: string;
  outline: OutlineItem[];
  slides: SlideOut[];
}
