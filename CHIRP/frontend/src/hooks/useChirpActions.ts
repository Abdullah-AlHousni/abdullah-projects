import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  commentOnChirp,
  createChirp,
  likeChirp,
  retweetChirp,
  undoRetweet,
  unlikeChirp,
} from "../api/chirps";
import type { CreateChirpPayload } from "../api/chirps";

export const useCreateChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChirpPayload) => createChirp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useLikeChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => likeChirp(chirpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useUnlikeChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => unlikeChirp(chirpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useRetweetChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => retweetChirp(chirpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useUndoRetweetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => undoRetweet(chirpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useCommentOnChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chirpId, content }: { chirpId: string; content: string }) =>
      commentOnChirp(chirpId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chirp", variables.chirpId, "comments"] });
    },
  });
};
