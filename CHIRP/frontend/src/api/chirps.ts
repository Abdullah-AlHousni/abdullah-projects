import apiClient from "./client";
import type { Chirp, Comment, Profile } from "../types/api";

export interface CreateChirpPayload {
  content: string;
  media?: File | null;
}

export const createChirp = async ({ content, media }: CreateChirpPayload) => {
  const formData = new FormData();
  formData.append("content", content);
  if (media) {
    formData.append("media", media);
  }

  const response = await apiClient.post<{ chirp: Chirp }>("/chirps", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.chirp;
};

export const fetchFeed = async (limit = 20) => {
  const response = await apiClient.get<{ chirps: Chirp[] }>("/chirps/feed", {
    params: { limit },
  });
  return response.data.chirps;
};

export const fetchChirpById = async (chirpId: string) => {
  const response = await apiClient.get<{ chirp: Chirp }>(`/chirps/${chirpId}`);
  return response.data.chirp;
};

export const fetchProfile = async (username: string) => {
  const response = await apiClient.get<{ profile: Profile }>(`/profiles/${username}`);
  return response.data.profile;
};

export const fetchUserChirps = async (username: string) => {
  const response = await apiClient.get<{ profile: { chirps: Chirp[] } }>(`/chirps/user/${username}`);
  return response.data.profile.chirps;
};

export const likeChirp = async (chirpId: string) => {
  const response = await apiClient.post<{ likeCount: number }>(`/engagements/chirps/${chirpId}/like`);
  return response.data.likeCount;
};

export const unlikeChirp = async (chirpId: string) => {
  const response = await apiClient.delete<{ likeCount: number }>(`/engagements/chirps/${chirpId}/like`);
  return response.data.likeCount;
};

export const retweetChirp = async (chirpId: string) => {
  const response = await apiClient.post<{ retweetCount: number }>(`/engagements/chirps/${chirpId}/retweet`);
  return response.data.retweetCount;
};

export const undoRetweet = async (chirpId: string) => {
  const response = await apiClient.delete<{ retweetCount: number }>(`/engagements/chirps/${chirpId}/retweet`);
  return response.data.retweetCount;
};

export const commentOnChirp = async (chirpId: string, content: string) => {
  const response = await apiClient.post<{ comment: Comment }>(`/engagements/chirps/${chirpId}/comments`, {
    content,
  });
  return response.data.comment;
};

export const fetchComments = async (chirpId: string) => {
  const response = await apiClient.get<{ comments: Comment[] }>(`/engagements/chirps/${chirpId}/comments`);
  return response.data.comments;
};
