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

export interface Chirp {
  id: string;
  content: string;
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
