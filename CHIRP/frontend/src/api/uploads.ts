import apiClient from "./client";

export interface UploadResponse {
  url: string;
  mediaType: "image" | "video";
}

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
