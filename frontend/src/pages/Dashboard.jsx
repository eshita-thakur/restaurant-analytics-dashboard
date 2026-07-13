import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import {
  getRevenue, getItemPerformance, getInventoryTurnover,
  getSalesGrowth, getPeakHours, getCustomerRetention,
  getEmployeePerformance, getFoodWaste
} from "../api/analytics";

function StatCard({ label, value, sublabel }) {
  return (
    <div className="bg-white border border-ink/10 rounded-sm p-5 animate-ticket-in">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{label}</p>
      <p className="font-mono text-2xl text-lavender">{value}</p>
      {sublabel && <p className="text-xs text-ink/40 mt-1">{sublabel}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white border border-ink/10 rounded-sm p-6 animate-ticket-in">
      <h2 className="font-display text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [
          revRes, itemsRes, turnoverRes, growthRes,
          peakRes, retentionRes, employeeRes, wasteRes
        ] = await Promise.all([
          getRevenue(), getItemPerformance(5), getInventoryTurnover(),
          getSalesGrowth(), getPeakHours(), getCustomerRetention(),
          getEmployeePerformance(), getFoodWaste()
        ]);

        setData({
          revenue: revRes.data,
          items: itemsRes.data,
          turnover: turnoverRes.data,
          growth: growthRes.data,
          peak: peakRes.data,
          retention: retentionRes.data,
          employees: employeeRes.data,
          waste: wasteRes.data,
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading || !data) {
    return (
      <Layout>
        <p className="text-ink/40 text-sm">Loading your dashboard...</p>
      </Layout>
    );
  }

  const { revenue, items, turnover, growth, peak, retention, employees, waste } = data;
  const dailyChartData = revenue.daily.slice(-14);
  const peakHoursWithOrders = peak.hourly.filter((h) => h.order_count > 0);
  const latestGrowth = growth.monthly_growth[growth.monthly_growth.length - 1];

  return (
    <Layout>
      <h1 className="font-display text-3xl mb-1">Welcome back, {user?.username}</h1>
      <p className="text-ink/60 mb-8">Here's what's happening at your restaurant.</p>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`₹${revenue.total_revenue.toLocaleString()}`} />
        <StatCard label="Total Orders" value={revenue.total_orders} />
        <StatCard label="Average Order Value" value={`₹${revenue.average_order_value.toFixed(2)}`} />
        <StatCard
          label="Customer Retention"
          value={`${retention.retention_rate}%`}
          sublabel={`${retention.returning_customers} of ${retention.total_customers} customers`}
        />
      </div>

      {/* Revenue chart */}
      <ChartCard title="Revenue trend">
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
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top selling items */}
        <ChartCard title="Top selling items">
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
        </ChartCard>

        {/* Peak hours */}
        <ChartCard title="Peak hours">
          {peakHoursWithOrders.length === 0 ? (
            <p className="text-sm text-ink/40">No order data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={peak.hourly}>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#2A241D99" }}
                  tickFormatter={(h) => `${h}:00`}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 12, fill: "#2A241D99" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 4, border: "1px solid #2A241D1A", fontSize: 13 }}
                  labelFormatter={(h) => `${h}:00`}
                  formatter={(value) => [value, "Orders"]}
                />
                <Bar dataKey="order_count" fill="#9FC9E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Inventory turnover */}
        <ChartCard title="Inventory turnover">
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
        </ChartCard>

        {/* Employee performance */}
        <ChartCard title="Employee performance">
          {employees.employees.length === 0 ? (
            <p className="text-sm text-ink/40">No order data yet.</p>
          ) : (
            <div className="space-y-3">
              {employees.employees.map((emp) => (
                <div key={emp.employee_id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-ink/40 ml-2 text-xs">{emp.orders_handled} orders</span>
                  </div>
                  <span className="font-mono text-lavender">₹{emp.total_revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
        {/* Sales growth */}
        <ChartCard title="Monthly sales growth">
          {growth.monthly_growth.length === 0 ? (
            <p className="text-sm text-ink/40">Not enough data yet to calculate growth.</p>
          ) : (
            <div className="space-y-3">
              {growth.monthly_growth.map((m) => (
                <div key={m.month} className="flex items-center justify-between text-sm">
                  <span>{m.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-ink/60">₹{m.revenue.toLocaleString()}</span>
                    {m.growth_percent !== null && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        m.growth_percent >= 0 ? "bg-sky/20 text-navy" : "bg-red-100 text-red-700"
                      }`}>
                        {m.growth_percent >= 0 ? "+" : ""}{m.growth_percent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Food waste */}
        <ChartCard title="Food waste">
          {waste.waste_by_item.length === 0 ? (
            <p className="text-sm text-ink/40">No waste recorded — great work!</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-ink/50 mb-2">{waste.total_waste_events} waste events logged</p>
              {waste.waste_by_item.map((w) => (
                <div key={w.inventory_id} className="flex items-center justify-between text-sm">
                  <span>{w.item_name}</span>
                  <span className="font-mono text-blossom">{w.total_wasted} {w.unit}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </Layout>
  );
}