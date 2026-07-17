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

export interface ProjectOut {
  id: string;
  title: string;
  raw_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  updated_at: string;
}

export interface ProjectDetail {
  project: ProjectOut;
  slides: SlideOut[];
}
