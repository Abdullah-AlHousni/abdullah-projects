import { useFeed } from "../hooks/useFeed";
import { ChirpCard } from "../components/ChirpCard";
import { ChirpComposer } from "../components/ChirpComposer";

const FeedPage = () => {
  const { data: chirps, isLoading } = useFeed();

  return (
    <div className="w-full max-w-2xl space-y-6">
      <ChirpComposer />
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/50" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/50" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/50" />
        </div>
      ) : chirps && chirps.length > 0 ? (
        <div className="space-y-4">
          {chirps.map((chirp) => (
            <ChirpCard key={chirp.id} chirp={chirp} />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400">No chirps yet. Be the first to post!</p>
      )}
    </div>
  );
};

export default FeedPage;
