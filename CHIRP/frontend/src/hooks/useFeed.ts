import { useQuery } from "@tanstack/react-query";
import { fetchFeed } from "../api/chirps";

export const useFeed = (limit = 20) =>
  useQuery({
    queryKey: ["feed", limit],
    queryFn: () => fetchFeed(limit),
    select: (chirps) =>
      chirps.map((chirp) => ({
        ...chirp,
        viewerHasLiked: chirp.viewerHasLiked ?? false,
        viewerHasRechirped: chirp.viewerHasRechirped ?? false,
      })),
  });
