import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  commentOnChirp,
  createChirp,
  likeChirp,
  rechirpChirp,
  undoRechirp,
  unlikeChirp,
} from "../api/chirps";
import type { Chirp, CreateChirpPayload, Profile, Comment } from "../types/api";

const updateChirpCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  chirpId: string,
  updater: (chirp: Chirp) => Chirp,
) => {
  queryClient.setQueriesData<Chirp[]>({ queryKey: ["feed"] }, (old) => {
    if (!old) return old;
    return old.map((chirp) => (chirp.id === chirpId ? updater(chirp) : chirp));
  });

  queryClient
    .getQueryCache()
    .findAll({ queryKey: ["profile"] })
    .forEach(({ queryKey }) => {
      queryClient.setQueryData<Profile | undefined>(queryKey, (profile) => {
        if (!profile) return profile;
        return {
          ...profile,
          chirps: profile.chirps.map((chirp) =>
            chirp.id === chirpId ? updater(chirp) : chirp,
          ),
        };
      });
    });

  queryClient.setQueryData<Chirp | undefined>(["chirp", chirpId], (old) =>
    old ? updater(old) : old,
  );
};

const appendCommentToCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  chirpId: string,
  comment: Comment,
) => {
  queryClient.setQueryData<Comment[] | undefined>(
    ["chirp", chirpId, "comments"],
    (existing) => (existing ? [comment, ...existing] : [comment]),
  );
};

export const useCreateChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChirpPayload) => createChirp(payload),
    onSuccess: (newChirp) => {
      const enriched: Chirp = {
        ...newChirp,
        viewerHasLiked: false,
        viewerHasRechirped: false,
      };
      queryClient.setQueriesData<Chirp[]>({ queryKey: ["feed"] }, (old) =>
        old ? [enriched, ...old] : [enriched],
      );
    },
  });
};

export const useLikeChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => likeChirp(chirpId),
    onSuccess: (_likeCount, chirpId) => {
      updateChirpCaches(queryClient, chirpId, (chirp) => ({
        ...chirp,
        _count: {
          ...chirp._count,
          likes: chirp._count.likes + 1,
        },
        viewerHasLiked: true,
      }));
    },
  });
};

export const useUnlikeChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => unlikeChirp(chirpId),
    onSuccess: (_likeCount, chirpId) => {
      updateChirpCaches(queryClient, chirpId, (chirp) => ({
        ...chirp,
        _count: {
          ...chirp._count,
          likes: Math.max(0, chirp._count.likes - 1),
        },
        viewerHasLiked: false,
      }));
    },
  });
};

export const useRechirpChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => rechirpChirp(chirpId),
    onSuccess: (_rechirpCount, chirpId) => {
      updateChirpCaches(queryClient, chirpId, (chirp) => ({
        ...chirp,
        _count: {
          ...chirp._count,
          retweets: chirp._count.retweets + 1,
        },
        viewerHasRechirped: true,
      }));
    },
  });
};

export const useUndoRechirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chirpId: string) => undoRechirp(chirpId),
    onSuccess: (_rechirpCount, chirpId) => {
      updateChirpCaches(queryClient, chirpId, (chirp) => ({
        ...chirp,
        _count: {
          ...chirp._count,
          retweets: Math.max(0, chirp._count.retweets - 1),
        },
        viewerHasRechirped: false,
      }));
    },
  });
};

export const useCommentOnChirpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chirpId, content }: { chirpId: string; content: string }) =>
      commentOnChirp(chirpId, content),
    onSuccess: (comment, { chirpId }) => {
      appendCommentToCache(queryClient, chirpId, comment);
      updateChirpCaches(queryClient, chirpId, (chirp) => ({
        ...chirp,
        _count: {
          ...chirp._count,
          comments: chirp._count.comments + 1,
        },
      }));
    },
  });
};
