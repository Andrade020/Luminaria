export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_hash: string
  created_at: string
  updated_at: string
  owner?: User
  member_count?: number
}

export interface Folder {
  id: string
  project_id: string
  parent_folder_id: string | null
  name: string
  order_index: number
  created_at: string
  children?: Folder[]
  loom_count?: number
}

export interface Loom {
  id: string
  folder_id: string | null
  project_id: string
  loom_url: string
  loom_embed_id: string
  title: string
  description: string | null
  uploaded_by_id: string | null
  uploaded_by_guest_name: string | null
  created_at: string
  uploader?: User
  comment_count?: number
}

export interface Comment {
  id: string
  loom_id: string
  user_id: string | null
  guest_name: string | null
  guest_session_token: string | null
  content: string
  parent_comment_id: string | null
  created_at: string
  author?: User
  replies?: Comment[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member' | 'viewer'
  created_at: string
  user?: User
}

export interface GuestSession {
  project_id: string
  guest_name: string
  session_token: string
}
