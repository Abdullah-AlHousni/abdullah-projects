import apiClient from "./client";
import type { FactCheck } from "../types/api";

export const requestFactCheck = async (chirpId: string) => {
  const response = await apiClient.post<{ factCheck: FactCheck }>(`/api/factcheck/${chirpId}`);
  return response.data.factCheck;
};

export const fetchFactCheck = async (chirpId: string) => {
  const response = await apiClient.get<{ factCheck: FactCheck }>(`/api/factcheck/${chirpId}`);
  return response.data.factCheck;
};
