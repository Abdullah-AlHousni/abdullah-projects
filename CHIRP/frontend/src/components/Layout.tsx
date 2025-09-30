import { Link, NavLink, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-primary text-white" : "text-slate-200 hover:bg-slate-800"}`;

export const Layout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Chirp
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Feed
            </NavLink>
            {user && (
              <NavLink to={`/profile/${user.username}`} className={navLinkClass}>
                Profile
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-300 sm:inline">@{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl justify-center px-4 py-6">{children}</main>
    </div>
  );
};

export default Layout;
