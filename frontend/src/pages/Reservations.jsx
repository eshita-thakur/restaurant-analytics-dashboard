import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getReservations, createReservation, updateReservationStatus } from "../api/reservations";
import { getCustomers } from "../api/customers";

const STATUS_COLORS = {
  booked: "bg-lavender/20 text-navy",
  seated: "bg-sky/20 text-navy",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-ink/10 text-ink/50",
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [dateFilter]);

  async function loadReservations() {
    setLoading(true);
    const res = await getReservations(dateFilter);
    setReservations(res.data);
    setLoading(false);
  }

  async function changeStatus(id, status) {
    await updateReservationStatus(id, status);
    loadReservations();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Reservations</h1>
          <p className="text-ink/60">Tonight's tables</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
        >
          + New Reservation
        </button>
      </div>

      <input
        type="date"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="border border-ink/20 rounded-sm px-3 py-2 text-sm mb-6 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
      />

      {loading ? (
        <p className="text-ink/40 text-sm">Loading reservations...</p>
      ) : reservations.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No reservations for this date.
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.reservation_id} className="bg-white border border-ink/10 rounded-sm p-5 flex items-center justify-between animate-ticket-in">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{r.customer_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status]}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-ink/60">
                  Table {r.table_number} · {r.party_size} guests ·{" "}
                  <span className="font-mono">
                    {new Date(r.reservation_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </p>
              </div>

              {r.status === "booked" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => changeStatus(r.reservation_id, "seated")}
                    className="text-xs px-3 py-1.5 bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
                  >
                    Seat
                  </button>
                  <button
                    onClick={() => changeStatus(r.reservation_id, "no_show")}
                    className="text-xs px-3 py-1.5 text-ink/50 hover:text-red-500 transition-colors"
                  >
                    No-show
                  </button>
                  <button
                    onClick={() => changeStatus(r.reservation_id, "cancelled")}
                    className="text-xs px-3 py-1.5 text-ink/50 hover:text-red-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NewReservationModal
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadReservations(); }}
        />
      )}
    </Layout>
  );
}

function NewReservationModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id: "", table_number: "", reservation_time: "", party_size: 2 });
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data));
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createReservation({
        ...form,
        customer_id: Number(form.customer_id),
        party_size: Number(form.party_size),
        reservation_time: new Date(form.reservation_time).toISOString(),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create reservation");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-4">New Reservation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            required
            value={form.customer_id}
            onChange={(e) => updateField("customer_id", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
          <input type="text" required placeholder="Table number" value={form.table_number}
            onChange={(e) => updateField("table_number", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="datetime-local" required value={form.reservation_time}
            onChange={(e) => updateField("reservation_time", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="number" min="1" required placeholder="Party size" value={form.party_size}
            onChange={(e) => updateField("party_size", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5">Cancel</button>
            <button type="submit" className="flex-1 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}