import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMedia } from "../api/uploads";
import { useCreateChirpMutation } from "../hooks/useChirpActions";

const MAX_LENGTH = 280;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const ChirpComposer = () => {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mutation = useCreateChirpMutation();

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(mediaFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [mediaFile]);

  const characterCount = useMemo(() => `${content.length}/${MAX_LENGTH}`, [content.length]);

  const clearFileSelection = () => {
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFormError(null);

    if (!file) {
      clearFileSelection();
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFormError("Uploads are limited to 20 MB.");
      clearFileSelection();
      return;
    }

    setMediaFile(file);
  };

  const resetForm = () => {
    setContent("");
    clearFileSelection();
    setPreviewUrl(null);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    try {
      setFormError(null);
      let mediaUrl: string | null = null;
      let mediaType: "image" | "video" | null = null;

      if (mediaFile) {
        setIsUploadingMedia(true);
        const uploadResult = await uploadMedia(mediaFile);
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.mediaType;
      }

      await mutation.mutateAsync({
        content,
        mediaUrl,
        mediaType,
      });

      resetForm();
    } catch (error) {
      console.error("Failed to create chirp", error);
      setFormError("We couldn't post your chirp. Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm"
    >
      <textarea
        value={content}
        maxLength={MAX_LENGTH}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What's chirping?"
        className="h-28 w-full resize-none rounded-md border border-slate-800 bg-slate-950/60 p-3 text-slate-100 focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-700 px-3 py-2 hover:border-primary">
          <span>Attach media</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <span>{characterCount}</span>
      </div>

      {previewUrl && mediaFile && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
          {mediaFile.type.startsWith("video/") ? (
            <video src={previewUrl} controls className="max-h-80 w-full bg-black object-contain" />
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full object-cover" />
          )}
          <button
            type="button"
            onClick={clearFileSelection}
            className="w-full bg-slate-900/80 py-2 text-sm text-primary hover:text-primary/80"
          >
            Remove media
          </button>
        </div>
      )}

      {(formError || mutation.isError) && (
        <p className="mt-2 text-sm text-red-400">
          {formError ?? "Something went wrong. Try again."}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isUploadingMedia || mutation.isPending || !content.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploadingMedia ? "Uploading..." : mutation.isPending ? "Chirping..." : "Chirp"}
        </button>
      </div>
    </form>
  );
};

export default ChirpComposer;
