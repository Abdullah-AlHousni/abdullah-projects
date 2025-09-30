import { useState } from "react";
import { useCommentOnChirpMutation } from "../hooks/useChirpActions";
import { useComments } from "../hooks/useComments";

interface CommentListProps {
  chirpId: string;
}

export const CommentList = ({ chirpId }: CommentListProps) => {
  const [comment, setComment] = useState("");
  const { data: comments, isLoading } = useComments(chirpId);
  const mutation = useCommentOnChirpMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) {
      return;
    }

    await mutation.mutateAsync({ chirpId, content: comment });
    setComment("");
  };

  return (
    <div className="mt-3 space-y-3 border-t border-slate-800 pt-3 text-sm">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Add a comment"
          className="flex-1 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 font-medium text-white"
          disabled={mutation.isPending || !comment.trim()}
        >
          Send
        </button>
      </form>
      {isLoading ? (
        <p className="text-slate-500">Loading comments...</p>
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-2">
          {comments.map((item) => (
            <li key={item.id} className="rounded-md bg-slate-900/60 p-2">
              <p className="text-xs text-slate-400">@{item.author.username}</p>
              <p className="text-slate-200">{item.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">No comments yet.</p>
      )}
    </div>
  );
};

export default CommentList;
