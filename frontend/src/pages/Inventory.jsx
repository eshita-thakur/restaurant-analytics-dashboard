import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getInventory, createInventoryItem, deleteInventoryItem,
  stockIn, stockOut, getTransactions
} from "../api/inventory";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stockModal, setStockModal] = useState(null); // { item, mode: "in" | "out" }
  const [historyItem, setHistoryItem] = useState(null);

  useEffect(() => {
    loadInventory();
  }, [lowStockOnly]);

  async function loadInventory() {
    setLoading(true);
    const res = await getInventory(lowStockOnly);
    setItems(res.data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this inventory item? This cannot be undone.")) return;
    await deleteInventoryItem(id);
    loadInventory();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Inventory</h1>
          <p className="text-ink/60">Stock levels and movement</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
        >
          + New Item
        </button>
      </div>

      <label className="flex items-center gap-2 mb-6 text-sm text-ink/70 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={(e) => setLowStockOnly(e.target.checked)}
          className="accent-lavender"
        />
        Show low stock only
      </label>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading inventory...</p>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No inventory items found.
        </div>
      ) : (
        <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Reorder at</th>
                <th className="px-5 py-3 font-medium">Unit cost</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.inventory_id} className="border-b border-ink/5 last:border-0 hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{item.item_name}</td>
                  <td className="px-5 py-3">
                    <span className={`font-mono ${item.low_stock ? "text-red-600" : "text-ink"}`}>
                      {item.quantity_in_stock} {item.unit}
                    </span>
                    {item.low_stock && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Low stock
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink/60">{item.reorder_level} {item.unit}</td>
                  <td className="px-5 py-3 font-mono text-lavender">₹{item.unit_cost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setStockModal({ item, mode: "in" })}
                      className="text-xs text-ink/50 hover:text-sky mr-3 transition-colors"
                    >
                      Stock in
                    </button>
                    <button
                      onClick={() => setStockModal({ item, mode: "out" })}
                      className="text-xs text-ink/50 hover:text-blossom mr-3 transition-colors"
                    >
                      Stock out
                    </button>
                    <button
                      onClick={() => setHistoryItem(item)}
                      className="text-xs text-ink/50 hover:text-lavender mr-3 transition-colors"
                    >
                      History
                    </button>
                    <button
                      onClick={() => handleDelete(item.inventory_id)}
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
        <NewItemModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); loadInventory(); }} />
      )}

      {stockModal && (
        <StockModal
          item={stockModal.item}
          mode={stockModal.mode}
          onClose={() => setStockModal(null)}
          onDone={() => { setStockModal(null); loadInventory(); }}
        />
      )}

      {historyItem && (
        <HistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
      )}
    </Layout>
  );
}

function NewItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ item_name: "", unit: "", quantity_in_stock: 0, reorder_level: 0, unit_cost: 0 });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createInventoryItem({
        ...form,
        quantity_in_stock: parseFloat(form.quantity_in_stock),
        reorder_level: parseFloat(form.reorder_level),
        unit_cost: parseFloat(form.unit_cost),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create item");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-4">New Inventory Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" required placeholder="Item name (e.g. Paneer)" value={form.item_name}
            onChange={(e) => updateField("item_name", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <input type="text" required placeholder="Unit (e.g. kg, litre, piece)" value={form.unit}
            onChange={(e) => updateField("unit", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          <div className="flex gap-3">
            <input type="number" step="0.01" placeholder="Starting stock" value={form.quantity_in_stock}
              onChange={(e) => updateField("quantity_in_stock", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
            <input type="number" step="0.01" placeholder="Reorder level" value={form.reorder_level}
              onChange={(e) => updateField("reorder_level", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender" />
          </div>
          <input type="number" step="0.01" placeholder="Unit cost (₹)" value={form.unit_cost}
            onChange={(e) => updateField("unit_cost", e.target.value)}
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

function StockModal({ item, mode, onClose, onDone }) {
  const [quantity, setQuantity] = useState("");
  const [transactionType, setTransactionType] = useState("out");
  const [error, setError] = useState("");
  const isIn = mode === "in";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isIn) {
        await stockIn(item.inventory_id, { quantity: parseFloat(quantity), reference_type: "manual" });
      } else {
        await stockOut(item.inventory_id, { quantity: parseFloat(quantity), transaction_type: transactionType });
      }
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update stock");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-1">{isIn ? "Stock In" : "Stock Out"}</h2>
        <p className="text-sm text-ink/60 mb-4">
          {item.item_name} · Currently {item.quantity_in_stock} {item.unit}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number" step="0.01" required autoFocus
            placeholder={`Quantity (${item.unit})`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          {!isIn && (
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            >
              <option value="out">Used in kitchen</option>
              <option value="waste">Waste/spoilage</option>
              <option value="adjustment">Manual adjustment</option>
            </select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5">Cancel</button>
            <button
              type="submit"
              className={`flex-1 py-2 text-sm rounded-sm text-paper transition-colors ${isIn ? "bg-sky/80 hover:bg-sky" : "bg-blossom/80 hover:bg-blossom"}`}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryModal({ item, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions(item.inventory_id).then((res) => {
      setTransactions(res.data);
      setLoading(false);
    });
  }, [item.inventory_id]);

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-ticket-in">
        <h2 className="font-display text-xl mb-1">Transaction History</h2>
        <p className="text-sm text-ink/60 mb-4">{item.item_name}</p>

        {loading ? (
          <p className="text-sm text-ink/40">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-ink/40">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.transaction_id} className="flex justify-between items-center border-b border-ink/5 last:border-0 py-2 text-sm">
                <div>
                  <span className="capitalize font-medium">{t.transaction_type}</span>
                  <span className="text-ink/40 ml-2 text-xs">{new Date(t.created_at).toLocaleString()}</span>
                </div>
                <span className={`font-mono ${t.transaction_type === "in" ? "text-sky" : "text-blossom"}`}>
                  {t.transaction_type === "in" ? "+" : "−"}{t.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-6 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5">
          Close
        </button>
      </div>
    </div>
  );
}