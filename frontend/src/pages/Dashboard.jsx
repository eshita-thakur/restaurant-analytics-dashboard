import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <h1 className="font-display text-3xl mb-2">
        Welcome back, {user?.username}
      </h1>
      <p className="text-ink/60 mb-8">
        Here's what's happening at your restaurant today.
      </p>

      <div className="bg-white border border-ink/10 rounded-sm p-8 text-center text-ink/40">
        Real KPIs and charts will live here once we build Phase 5/6 (Analytics).
      </div>
    </Layout>
  );
}