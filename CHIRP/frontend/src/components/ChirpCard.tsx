import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  useLikeChirpMutation,
  useRechirpChirpMutation,
  useUndoRechirpMutation,
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
  const [liked, setLiked] = useState(Boolean(chirp.viewerHasLiked));
  const [rechirped, setRechirped] = useState(Boolean(chirp.viewerHasRechirped));

  const likeMutation = useLikeChirpMutation();
  const unlikeMutation = useUnlikeChirpMutation();
  const rechirpMutation = useRechirpChirpMutation();
  const undoRechirpMutation = useUndoRechirpMutation();

  useEffect(() => {
    setLiked(Boolean(chirp.viewerHasLiked));
  }, [chirp.viewerHasLiked]);

  useEffect(() => {
    setRechirped(Boolean(chirp.viewerHasRechirped));
  }, [chirp.viewerHasRechirped]);

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

  const handleRechirpClick = async () => {
    try {
      if (rechirped) {
        await undoRechirpMutation.mutateAsync(chirp.id);
        setRechirped(false);
      } else {
        await rechirpMutation.mutateAsync(chirp.id);
        setRechirped(true);
      }
    } catch (error) {
      console.error("Failed to toggle rechirp", error);
    }
  };

  return (
    <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <header className="flex items-start justify-between text-sm text-slate-400">
        <div>
          <Link
            to={`/profile/${chirp.author.username}`}
            className="font-semibold text-primary hover:underline"
          >
            @{chirp.author.username}
          </Link>
          {chirp.author.bio && <p className="text-xs text-slate-500">{chirp.author.bio}</p>}
        </div>
        <time dateTime={chirp.createdAt}>{formatTimestamp(chirp.createdAt)}</time>
      </header>
      <p className="whitespace-pre-wrap text-slate-100">{chirp.content}</p>
      {chirp.mediaUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          {chirp.mediaType === "video" ? (
            <video
              controls
              src={chirp.mediaUrl}
              className="max-h-80 w-full bg-black object-contain"
            />
          ) : (
            <img
              src={chirp.mediaUrl}
              alt="Chirp attachment"
              className="w-full object-cover"
            />
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
          onClick={handleRechirpClick}
          className={`flex items-center gap-1 rounded-md px-3 py-2 ${rechirped ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-200"}`}
        >
          <span>Rechirp</span>
          <span>{chirp._count.retweets}</span>
        </button>
      </footer>
      {showComments && <CommentList chirpId={chirp.id} />}
    </article>
  );
};

export default ChirpCard;
