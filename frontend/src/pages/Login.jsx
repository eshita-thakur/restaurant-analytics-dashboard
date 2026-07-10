import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const PETAL_COLORS = ["text-blossom", "text-lavender", "text-sky"];

const PETALS = Array.from({ length: 16 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 10 + Math.random() * 14,
  duration: 9 + Math.random() * 8,
  delay: Math.random() * 10,
  color: PETAL_COLORS[i % PETAL_COLORS.length],
}));

const BLOOM_ANGLES = [0, 60, 120, 180, 240, 300];

function BloomEmblem({ className = "", petalColor = "text-blossom" }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {BLOOM_ANGLES.map((deg, i) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <ellipse
            cx="50"
            cy="28"
            rx="9"
            ry="16"
            className={`bloom-petal ${petalColor}`}
            fill="currentColor"
            opacity="0.9"
            style={{ transformOrigin: "50px 28px", animationDelay: `${0.4 + i * 0.08}s` }}
          />
        </g>
      ))}
      <circle
        cx="50"
        cy="50"
        r="7"
        className="bloom-petal text-sky"
        fill="currentColor"
        style={{ transformOrigin: "50px 50px", animationDelay: "0.9s" }}
      />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.user, response.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden md:flex relative w-1/2 bg-navy text-paper flex-col justify-between p-12 overflow-hidden">

        {/* Falling petals */}
        {PETALS.map((p) => (
          <div
            key={p.id}
            className={`petal ${p.color}`}
            style={{
              left: `${p.left}%`,
              "--size": `${p.size}px`,
              "--duration": `${p.duration}s`,
              "--delay": `${p.delay}s`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full opacity-80">
              <path d="M12 2C8.5 2 6 5.5 6 9c0 4.5 3.5 9 6 13c2.5-4 6-8.5 6-13c0-3.5-2.5-7-6-7z" />
            </svg>
          </div>
        ))}

        <div className="relative z-10 flex items-center gap-3 animate-ticket-in">
          <BloomEmblem className="w-9 h-9" petalColor="text-blossom" />
          <span className="font-display text-2xl tracking-wide">Bloom & Table</span>
        </div>

        <div className="relative z-10 animate-ticket-in" style={{ animationDelay: "0.15s" }}>
          <p className="font-display text-4xl leading-tight mb-4">
            Every order,<br />every number,<br />in full bloom.
          </p>
          <p className="font-body text-paper/60 max-w-sm">
            Sign in to track revenue, manage your floor, and keep the evening running beautifully.
          </p>
        </div>

        <div className="relative z-10 font-mono text-xs text-paper/40 animate-ticket-in" style={{ animationDelay: "0.3s" }}>
          RESTAURANT ANALYTICS DASHBOARD — EST. 2026
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-paper">
        <div className="w-full max-w-sm animate-ticket-in" style={{ animationDelay: "0.2s" }}>
          <div
            className="relative bg-white border border-ink/10 rounded-sm p-8"
            style={{ borderStyle: "dashed" }}
          >
            <BloomEmblem className="w-10 h-10 absolute -top-5 -right-5" petalColor="text-lavender" />

            <h1 className="font-display text-3xl mb-1">Welcome back</h1>
            <p className="text-ink/60 text-sm mb-8">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-ink/20 rounded-sm px-3 py-2.5 font-body focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender transition-all duration-200"
                  placeholder="you@restaurant.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-ink/20 rounded-sm px-3 py-2.5 font-body focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 animate-ticket-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-paper font-medium py-2.5 rounded-sm hover:bg-blossom hover:text-navy active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-paper dot-bounce" style={{ animationDelay: "0s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-paper dot-bounce" style={{ animationDelay: "0.15s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-paper dot-bounce" style={{ animationDelay: "0.3s" }} />
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-ink/60 mt-6">
              New here?{" "}
             <Link to="/signup" className="text-lavender font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-ink/40 mt-6 font-mono">
            ORDER #{Math.floor(Math.random() * 9000 + 1000)} · TABLE READY
          </p>
        </div>
      </div>
    </div>
  );
}