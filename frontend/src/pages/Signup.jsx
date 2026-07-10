import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { ...form, role_name: "owner" });
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-8">
      <div className="w-full max-w-sm animate-ticket-in">
        <div className="relative bg-white border border-ink/10 rounded-sm p-8" style={{ borderStyle: "dashed" }}>
          <h1 className="font-display text-3xl mb-1">Create your account</h1>
          <p className="text-ink/60 text-sm mb-8">Set up your restaurant's dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                className="w-full border border-ink/20 rounded-sm px-3 py-2.5 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender transition-all"
                placeholder="yourname"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full border border-ink/20 rounded-sm px-3 py-2.5 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender transition-all"
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
                minLength={6}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full border border-ink/20 rounded-sm px-3 py-2.5 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender transition-all"
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
              className="w-full bg-navy text-paper font-medium py-2.5 rounded-sm hover:bg-blossom hover:text-navy active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink/60 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-lavender font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}