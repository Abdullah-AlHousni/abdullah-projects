import { useQuery } from "@tanstack/react-query";
import { fetchFactCheck } from "../api/factchecks";
import type { FactCheck } from "../types/api";

export const useFactCheck = (chirpId: string, enabled: boolean) =>
  useQuery<FactCheck | null, Error>({
    queryKey: ["fact-check", chirpId],
    queryFn: async () => {
      try {
        return await fetchFactCheck(chirpId);
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status === 404
        ) {
          return null;
        }
        throw error as Error;
      }
    },
    enabled,
    refetchInterval: (data) => {
      if (!data) {
        return false;
      }
      if (data.status === "PENDING" || data.status === "RUNNING") {
        return 4_000;
      }
      return false;
    },
  });
