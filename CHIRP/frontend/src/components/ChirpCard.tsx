import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  useLikeChirpMutation,
  useRechirpChirpMutation,
  useUndoRechirpMutation,
  useUnlikeChirpMutation,
} from "../hooks/useChirpActions";
import { useFactCheck } from "../hooks/useFactCheck";
import { requestFactCheck } from "../api/factchecks";
import type { Chirp, FactCheck } from "../types/api";
import { CommentList } from "./CommentList";

interface ChirpCardProps {
  chirp: Chirp;
}

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

const verdictLabelMap: Record<string, string> = {
  VERIFIED: "Verified",
  DISPUTED: "Disputed",
  NEEDS_CONTEXT: "Needs context",
  INSUFFICIENT_EVIDENCE: "Insufficient evidence",
};

const statusText = (factCheck: FactCheck | null, isLoading: boolean): string => {
  if (isLoading) return "Checking…";
  if (!factCheck) return "Request fact check";
  if (factCheck.status === "PENDING" || factCheck.status === "RUNNING") return "Checking…";
  if (factCheck.status === "ERROR") return "Fact check error";
  if (factCheck.status === "DONE" && factCheck.verdict) {
    return verdictLabelMap[factCheck.verdict] ?? "Fact checked";
  }
  return "Fact checked";
};

const badgeClass = (factCheck: FactCheck | null, isLoading: boolean) => {
  if (isLoading) return "bg-amber-500/20 text-amber-300";
  if (!factCheck) return "bg-slate-800 text-slate-200";
  if (factCheck.status === "PENDING" || factCheck.status === "RUNNING") return "bg-amber-500/20 text-amber-300";
  if (factCheck.status === "ERROR") return "bg-red-500/20 text-red-300";
  if (factCheck.status === "DONE") {
    switch (factCheck.verdict) {
      case "VERIFIED":
        return "bg-emerald-500/20 text-emerald-300";
      case "DISPUTED":
        return "bg-red-500/20 text-red-300";
      case "NEEDS_CONTEXT":
        return "bg-blue-500/20 text-blue-300";
      case "INSUFFICIENT_EVIDENCE":
        return "bg-slate-700 text-slate-200";
      default:
        return "bg-slate-800 text-slate-200";
    }
  }
  return "bg-slate-800 text-slate-200";
};

const normalizeCitations = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export const ChirpCard = ({ chirp }: ChirpCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(Boolean(chirp.viewerHasLiked));
  const [rechirped, setRechirped] = useState(Boolean(chirp.viewerHasRechirped));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const factCheckQuery = useFactCheck(chirp.id, true);
  const factCheck = factCheckQuery.data ?? null;

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

  const handleBadgeClick = async () => {
    if (!factCheck && !isRequesting) {
      try {
        setIsRequesting(true);
        await requestFactCheck(chirp.id);
        await factCheckQuery.refetch();
      } catch (error) {
        console.error("Failed to request fact check", error);
      } finally {
        setIsRequesting(false);
      }
      return;
    }

    if (factCheck && (factCheck.status === "DONE" || factCheck.status === "ERROR")) {
      setIsModalOpen(true);
    }
  };

  const badgeLabel = useMemo(
    () => statusText(factCheck, factCheckQuery.isLoading || isRequesting),
    [factCheck, factCheckQuery.isLoading, isRequesting],
  );

  const citations = normalizeCitations(factCheck?.citationsJson);
  const confidencePercent = factCheck?.confidence != null ? Math.round(factCheck.confidence * 100) : null;

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
      <div className="flex items-center justify-between text-xs text-slate-300">
        <button
          type="button"
          onClick={handleBadgeClick}
          disabled={factCheckQuery.isLoading || isRequesting}
          className={`rounded-full px-3 py-1 font-medium transition ${badgeClass(
            factCheck,
            factCheckQuery.isLoading || isRequesting,
          )} disabled:opacity-60`}
        >
          {badgeLabel}
        </button>
      </div>
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

      {isModalOpen && factCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fact check</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Status: {badgeLabel}</p>
              {factCheck.summary && <p className="text-slate-300">{factCheck.summary}</p>}
              {confidencePercent != null && (
                <p className="text-slate-400">Confidence: {confidencePercent}%</p>
              )}
              {citations.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium">Citations</p>
                  <ul className="list-inside list-disc space-y-1">
                    {citations.map((url) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default ChirpCard;
