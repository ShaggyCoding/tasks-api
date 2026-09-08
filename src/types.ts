export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface NoteRow {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenPayload {
  sub: number;
  email: string;
}
