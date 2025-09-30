import apiClient from "./client";
import type { User } from "../types/api";

export interface SignupPayload {
  email: string;
  username: string;
  password: string;
  bio?: string;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const signup = async (payload: SignupPayload) => {
  const response = await apiClient.post<AuthResponse>("/auth/signup", payload);
  return response.data;
};

export const login = async (payload: LoginPayload) => {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get<{ user: User }>("/auth/me");
  return response.data.user;
};
