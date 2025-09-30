import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../api/chirps";

export const useProfile = (username: string | undefined) =>
  useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username ?? ""),
    enabled: Boolean(username),
    select: (profile) => ({
      ...profile,
      chirps: profile.chirps.map((chirp) => ({
        ...chirp,
        viewerHasLiked: chirp.viewerHasLiked ?? false,
        viewerHasRechirped: chirp.viewerHasRechirped ?? false,
      })),
    }),
  });
