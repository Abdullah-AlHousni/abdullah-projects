import { useState } from "react";
import { useCreateChirpMutation } from "../hooks/useChirpActions";

const MAX_LENGTH = 280;

export const ChirpComposer = () => {
  const [content, setContent] = useState("");
  const mutation = useCreateChirpMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    try {
      await mutation.mutateAsync({ content });
      setContent("");
    } catch (error) {
      console.error("Failed to create chirp", error);
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
      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>
          {content.length}/{MAX_LENGTH}
        </span>
      </div>
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-400">Something went wrong. Try again.</p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending || !content.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Chirping..." : "Chirp"}
        </button>
      </div>
    </form>
  );
};

export default ChirpComposer;
