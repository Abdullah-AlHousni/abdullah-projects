import { useParams } from "react-router-dom";
import { ChirpCard } from "../components/ChirpCard";
import { useProfile } from "../hooks/useProfile";

const ProfilePage = () => {
  const { username } = useParams();
  const { data: profile, isLoading } = useProfile(username);

  if (isLoading) {
    return <p className="text-slate-400">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="text-slate-400">Profile not found.</p>;
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-2xl font-bold text-slate-100">@{profile.username}</h2>
        <p className="mt-2 text-slate-300">{profile.bio || "No bio yet."}</p>
        <p className="mt-2 text-sm text-slate-500">
          Joined {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </header>
      <section className="space-y-4">
        {profile.chirps.length === 0 ? (
          <p className="text-center text-slate-400">No chirps yet.</p>
        ) : (
          profile.chirps.map((chirp) => <ChirpCard key={chirp.id} chirp={chirp} />)
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
