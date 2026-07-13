import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getRevenue, getItemPerformance, getInventoryTurnover } from "../api/analytics";

function StatCard({ label, value, sublabel }) {
  return (
    <div className="bg-white border border-ink/10 rounded-sm p-5 animate-ticket-in">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{label}</p>
      <p className="font-mono text-2xl text-lavender">{value}</p>
      {sublabel && <p className="text-xs text-ink/40 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [items, setItems] = useState(null);
  const [turnover, setTurnover] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadAll() {
    try {
      const [revRes, itemsRes, turnoverRes] = await Promise.all([
        getRevenue(),
        getItemPerformance(5),
        getInventoryTurnover(),
      ]);
      setRevenue(revRes.data);
      setItems(itemsRes.data);
      setTurnover(turnoverRes.data);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }
  loadAll();
}, []);

  if (loading || !revenue || !items || !turnover) {
    return (
      <Layout>
        <p className="text-ink/40 text-sm">Loading your dashboard...</p>
      </Layout>
    );
  }

  const dailyChartData = revenue.daily.slice(-14); // last 14 days with data

  return (
    <Layout>
      <h1 className="font-display text-3xl mb-1">Welcome back, {user?.username}</h1>
      <p className="text-ink/60 mb-8">Here's what's happening at your restaurant.</p>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`₹${revenue.total_revenue.toLocaleString()}`} />
        <StatCard label="Total Orders" value={revenue.total_orders} />
        <StatCard label="Average Order Value" value={`₹${revenue.average_order_value.toFixed(2)}`} />
      </div>

      {/* Revenue chart */}
      <div className="bg-white border border-ink/10 rounded-sm p-6 mb-8 animate-ticket-in">
        <h2 className="font-display text-lg mb-4">Revenue trend</h2>
        {dailyChartData.length === 0 ? (
          <p className="text-sm text-ink/40">No revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A241D" strokeOpacity={0.08} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#2A241D99" }} />
              <YAxis tick={{ fontSize: 12, fill: "#2A241D99" }} />
              <Tooltip
                contentStyle={{ borderRadius: 4, border: "1px solid #2A241D1A", fontSize: 13 }}
                formatter={(value) => [`₹${value}`, "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#B79FDB" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top selling items */}
        <div className="bg-white border border-ink/10 rounded-sm p-6 animate-ticket-in">
          <h2 className="font-display text-lg mb-4">Top selling items</h2>
          {items.top_selling.length === 0 ? (
            <p className="text-sm text-ink/40">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={items.top_selling} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 12, fill: "#2A241D99" }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "#2A241D" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 4, border: "1px solid #2A241D1A", fontSize: 13 }}
                  formatter={(value) => [value, "Units sold"]}
                />
                <Bar dataKey="total_quantity" fill="#E8A9C4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory turnover */}
        <div className="bg-white border border-ink/10 rounded-sm p-6 animate-ticket-in">
          <h2 className="font-display text-lg mb-4">Inventory turnover</h2>
          {turnover.items.length === 0 ? (
            <p className="text-sm text-ink/40">No inventory data yet.</p>
          ) : (
            <div className="space-y-3">
              {turnover.items.map((item) => (
                <div key={item.inventory_id} className="flex items-center justify-between text-sm">
                  <span>{item.item_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky"
                        style={{ width: `${Math.min(item.turnover_rate * 20, 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-ink/60 w-10 text-right">
                      {item.turnover_rate}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}