export interface User {
  id: string;
  email: string;
  username: string;
  bio: string;
  createdAt: string;
}

export interface ChirpCounts {
  likes: number;
  comments: number;
  retweets: number;
}

export type FactCheckStatus = "PENDING" | "RUNNING" | "DONE" | "ERROR";
export type FactCheckVerdict = "VERIFIED" | "DISPUTED" | "NEEDS_CONTEXT" | "INSUFFICIENT_EVIDENCE";

export interface FactCheck {
  id: string;
  chirpId: string;
  status: FactCheckStatus;
  verdict?: FactCheckVerdict | null;
  confidence?: number | null;
  summary?: string | null;
  citationsJson?: string[] | null;
  checkedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chirp {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  createdAt: string;
  author: Pick<User, "id" | "username" | "bio">;
  _count: ChirpCounts;
  viewerHasLiked?: boolean;
  viewerHasRechirped?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<User, "id" | "username">;
}

export interface Profile extends Pick<User, "id" | "username" | "bio" | "createdAt"> {
  chirps: Chirp[];
}
