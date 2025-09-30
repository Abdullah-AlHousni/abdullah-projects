import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../api/chirps";

export const useProfile = (username: string | undefined) =>
  useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username ?? ""),
    enabled: Boolean(username),
  });
