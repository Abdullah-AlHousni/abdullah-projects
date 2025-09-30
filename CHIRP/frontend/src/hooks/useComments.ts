import { useQuery } from "@tanstack/react-query";
import { fetchComments } from "../api/chirps";

export const useComments = (chirpId: string | undefined) =>
  useQuery({
    queryKey: ["chirp", chirpId, "comments"],
    queryFn: () => fetchComments(chirpId ?? ""),
    enabled: Boolean(chirpId),
  });
