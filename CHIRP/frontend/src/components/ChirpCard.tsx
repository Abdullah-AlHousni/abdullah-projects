import { useState } from "react";
import {
  useLikeChirpMutation,
  useRetweetChirpMutation,
  useUndoRetweetMutation,
  useUnlikeChirpMutation,
} from "../hooks/useChirpActions";
import type { Chirp } from "../types/api";
import { CommentList } from "./CommentList";

interface ChirpCardProps {
  chirp: Chirp;
}

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

export const ChirpCard = ({ chirp }: ChirpCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);

  const likeMutation = useLikeChirpMutation();
  const unlikeMutation = useUnlikeChirpMutation();
  const retweetMutation = useRetweetChirpMutation();
  const undoRetweetMutation = useUndoRetweetMutation();

  const handleLikeClick = async () => {
    try {
      if (liked) {
        await unlikeMutation.mutateAsync(chirp.id);
        setLiked(false);
      } else {
        await likeMutation.mutateAsync(chirp.id);
        setLiked(true);
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const handleRetweetClick = async () => {
    try {
      if (retweeted) {
        await undoRetweetMutation.mutateAsync(chirp.id);
        setRetweeted(false);
      } else {
        await retweetMutation.mutateAsync(chirp.id);
        setRetweeted(true);
      }
    } catch (error) {
      console.error("Failed to toggle retweet", error);
    }
  };

  return (
    <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <header className="flex items-start justify-between text-sm text-slate-400">
        <div>
          <p className="font-semibold text-slate-100">@{chirp.author.username}</p>
          {chirp.author.bio && <p className="text-xs text-slate-500">{chirp.author.bio}</p>}
        </div>
        <time dateTime={chirp.createdAt}>{formatTimestamp(chirp.createdAt)}</time>
      </header>
      <p className="whitespace-pre-wrap text-slate-100">{chirp.content}</p>
      {chirp.mediaUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          {chirp.mediaType === "video" ? (
            <video src={chirp.mediaUrl} controls className="h-64 w-full object-cover" />
          ) : (
            <img src={chirp.mediaUrl} alt="chirp media" className="w-full object-cover" />
          )}
        </div>
      )}
      <footer className="flex items-center gap-4 text-sm">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1 rounded-md px-3 py-2 ${liked ? "bg-primary/20 text-primary" : "bg-slate-800 text-slate-200"}`}
        >
          <span>Like</span>
          <span>{chirp._count.likes}</span>
        </button>
        <button
          onClick={() => setShowComments((prev) => !prev)}
          className="flex items-center gap-1 rounded-md bg-slate-800 px-3 py-2 text-slate-200"
        >
          <span>Comments</span>
          <span>{chirp._count.comments}</span>
        </button>
        <button
          onClick={handleRetweetClick}
          className={`flex items-center gap-1 rounded-md px-3 py-2 ${retweeted ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-200"}`}
        >
          <span>Retweet</span>
          <span>{chirp._count.retweets}</span>
        </button>
      </footer>
      {showComments && <CommentList chirpId={chirp.id} />}
    </article>
  );
};

export default ChirpCard;
