// Database models
export interface User {
  id: string;
  email: string;
  name: string;
  profile: string | null;
  avatar_url: string | null;
  storage_quota: number;
  storage_used: number;
  is_admin: boolean;
  created_at: number;
  updated_at: number;
}

export interface IIIFResource {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  attribution: string | null;
  license: string | null;
  metadata: string | null; // JSON string
  status: 'processing' | 'ready' | 'failed';
  visibility: 'public' | 'private';
  homepage: string | null;
  viewing_direction: 'left-to-right' | 'right-to-left' | 'top-to-bottom';
  created_at: number;
  updated_at: number;
}

export interface Image {
  id: string;
  resource_id: string;
  user_id: string;
  original_filename: string;
  file_path: string;
  ptiff_path: string | null;
  file_size: number;
  width: number | null;
  height: number | null;
  mime_type: string;
  order_index: number;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  job_id: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export interface JobStatus {
  id: string;
  image_id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  error_message: string | null;
  started_at: number | null;
  completed_at: number | null;
  created_at: number;
}

export interface QuotaRequest {
  id: string;
  user_id: string;
  current_quota: number;
  requested_quota: number;
  reason: string;
  status: '新着' | '閲覧済み' | '対応済み';
  admin_note: string | null;
  admin_id: string | null;
  viewed_at: number | null;
  handled_at: number | null;
  created_at: number;
  updated_at: number;
}

// Session data
export interface SessionData {
  userId?: string;
  oauthState?: string;
}

// Job data
export interface ImageProcessingJobData {
  imageId: string;
  resourceId: string;
  userId: string;
  originalPath: string;
  ptiffPath: string;
}

// IIIF Manifest types
export interface IIIFManifest {
  '@context': string | string[];
  id: string;
  type: 'Manifest';
  label: { [lang: string]: string[] };
  metadata?: Array<{
    label: { [lang: string]: string[] };
    value: { [lang: string]: string[] };
  }>;
  summary?: { [lang: string]: string[] };
  requiredStatement?: {
    label: { [lang: string]: string[] };
    value: { [lang: string]: string[] };
  };
  rights?: string;
  homepage?: Array<{
    id: string;
    type: 'Text';
    label: { [lang: string]: string[] };
    format: 'text/html';
  }>;
  thumbnail?: Array<{
    id: string;
    type: 'Image';
    format: string;
  }>;
  viewingDirection?: 'left-to-right' | 'right-to-left' | 'top-to-bottom';
  items: IIIFCanvas[];
}

export interface IIIFCanvas {
  id: string;
  type: 'Canvas';
  label?: { [lang: string]: string[] };
  width: number;
  height: number;
  items: IIIFAnnotationPage[];
}

export interface IIIFAnnotationPage {
  id: string;
  type: 'AnnotationPage';
  items: IIIFAnnotation[];
}

export interface IIIFAnnotation {
  id: string;
  type: 'Annotation';
  motivation: 'painting';
  target: string;
  body: {
    id: string;
    type: 'Image';
    format: string;
    width: number;
    height: number;
    service: Array<{
      id: string;
      type: string;
      profile: string;
    }>;
  };
}
