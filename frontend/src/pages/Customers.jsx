import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api/customers";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadCustomers() {
    setLoading(true);
    const res = await getCustomers(search || null);
    setCustomers(res.data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    await deleteCustomer(id);
    loadCustomers();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Customers</h1>
          <p className="text-ink/60">Your guest book</p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
        >
          + New Customer
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-ink/20 rounded-sm px-3 py-2 text-sm mb-6 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
      />

      {loading ? (
        <p className="text-ink/40 text-sm">Loading customers...</p>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No customers found.
        </div>
      ) : (
        <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Loyalty</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customer_id} className="border-b border-ink/5 last:border-0 hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="px-5 py-3 text-ink/60">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-ink/60">{c.phone || "—"}</td>
                  <td className="px-5 py-3 font-mono text-lavender">{c.loyalty_points} pts</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => { setEditingCustomer(c); setShowForm(true); }}
                      className="text-xs text-ink/50 hover:text-lavender mr-3 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.customer_id)}
                      className="text-xs text-ink/50 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadCustomers(); }}
        />
      )}
    </Layout>
  );
}

function CustomerFormModal({ customer, onClose, onSaved }) {
  const isEditing = Boolean(customer);
  const [form, setForm] = useState({
    first_name: customer?.first_name || "",
    last_name: customer?.last_name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    loyalty_points: customer?.loyalty_points || 0,
  });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isEditing) {
        await updateCustomer(customer.customer_id, form);
      } else {
        await createCustomer(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save customer");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-4">{isEditing ? "Edit Customer" : "New Customer"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              required
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
            <input
              type="text"
              required
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
          </div>
          <input
            type="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors">
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}