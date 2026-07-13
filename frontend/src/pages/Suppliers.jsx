import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../api/suppliers";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    setLoading(true);
    const res = await getSuppliers();
    setSuppliers(res.data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this supplier? This cannot be undone.")) return;
    await deleteSupplier(id);
    loadSuppliers();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Suppliers</h1>
          <p className="text-ink/60">Who stocks your kitchen</p>
        </div>
        <button
          onClick={() => { setEditingSupplier(null); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
        >
          + New Supplier
        </button>
      </div>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading suppliers...</p>
      ) : suppliers.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No suppliers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.supplier_id} className="bg-white border border-ink/10 rounded-sm p-5 animate-ticket-in">
              <h3 className="font-display text-lg mb-1">{s.name}</h3>
              <p className="text-sm text-ink/60 mb-1">{s.contact_person || "No contact listed"}</p>
              <p className="text-sm text-ink/50 mb-1">{s.phone || "—"}</p>
              <p className="text-sm text-ink/50 mb-4">{s.email || "—"}</p>

              <div className="flex gap-3 text-xs pt-4 border-t border-ink/10">
                <button
                  onClick={() => { setEditingSupplier(s); setShowForm(true); }}
                  className="text-ink/50 hover:text-lavender transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.supplier_id)}
                  className="text-ink/50 hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadSuppliers(); }}
        />
      )}
    </Layout>
  );
}

function SupplierFormModal({ supplier, onClose, onSaved }) {
  const isEditing = Boolean(supplier);
  const [form, setForm] = useState({
    name: supplier?.name || "",
    contact_person: supplier?.contact_person || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
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
        await updateSupplier(supplier.supplier_id, form);
      } else {
        await createSupplier(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save supplier");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-4">{isEditing ? "Edit Supplier" : "New Supplier"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" required placeholder="Supplier name" value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="text" placeholder="Contact person (optional)" value={form.contact_person}
            onChange={(e) => updateField("contact_person", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="text" placeholder="Phone (optional)" value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="email" placeholder="Email (optional)" value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="text" placeholder="Address (optional)" value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5">Cancel</button>
            <button type="submit" className="flex-1 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors">
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}