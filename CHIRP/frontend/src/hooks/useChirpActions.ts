import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  commentOnChirp,
  createChirp,
  likeChirp,
  rechirpChirp,
  undoRechirp,
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

export const useRechirpChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => rechirpChirp(chirpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};

export const useUndoRechirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => undoRechirp(chirpId),
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
