import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getCategories, createCategory, getItems, createItem, updateItem, deleteItem } from "../api/menu";

export default function Menu() {
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [activeCategory]);

  async function loadCategories() {
    const res = await getCategories();
    setCategories(res.data);
  }

  async function loadItems() {
    setLoading(true);
    const res = await getItems(activeCategory);
    setItems(res.data);
    setLoading(false);
  }

  async function handleToggleAvailability(item) {
    await updateItem(item.item_id, { is_available: !item.is_available });
    loadItems();
  }

  async function handleDelete(itemId) {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    await deleteItem(itemId);
    loadItems();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Menu</h1>
          <p className="text-ink/60">Manage your dishes and categories</p>
        </div>
        {canManage && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2 text-sm border border-ink/20 rounded-sm hover:border-lavender hover:text-lavender transition-colors"
            >
              + Category
            </button>
            <button
              onClick={() => setShowItemForm(true)}
              className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
            >
              + New Item
            </button>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
            activeCategory === null
              ? "bg-navy text-paper border-navy"
              : "border-ink/20 text-ink/60 hover:border-lavender"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setActiveCategory(cat.category_id)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              activeCategory === cat.category_id
                ? "bg-navy text-paper border-navy"
                : "border-ink/20 text-ink/60 hover:border-lavender"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <p className="text-ink/40 text-sm">Loading menu...</p>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No items in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.item_id}
              className="bg-white border border-ink/10 rounded-sm p-5 relative animate-ticket-in"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-lg">{item.name}</h3>
                <span className="font-mono text-sm text-lavender">
                  ₹{item.price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-ink/50 mb-1">{item.category}</p>
              {item.description && (
                <p className="text-sm text-ink/60 mb-4">{item.description}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink/10">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.is_available
                      ? "bg-sky/20 text-navy"
                      : "bg-ink/10 text-ink/50"
                  }`}
                >
                  {item.is_available ? "Available" : "Unavailable"}
                </span>

                {canManage && (
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className="text-ink/50 hover:text-lavender transition-colors"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => handleDelete(item.item_id)}
                      className="text-ink/50 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCategoryForm && (
        <CategoryFormModal
          onClose={() => setShowCategoryForm(false)}
          onCreated={() => {
            setShowCategoryForm(false);
            loadCategories();
          }}
        />
      )}

      {showItemForm && (
        <ItemFormModal
          categories={categories}
          onClose={() => setShowItemForm(false)}
          onCreated={() => {
            setShowItemForm(false);
            loadItems();
          }}
        />
      )}
    </Layout>
  );
}

function CategoryFormModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createCategory({ name, description });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create category");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-4">New Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemFormModal({ categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    cost_price: "",
    category_id: categories[0]?.category_id || "",
  });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createItem({
        ...form,
        price: parseFloat(form.price),
        cost_price: parseFloat(form.cost_price || 0),
        category_id: parseInt(form.category_id),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create item");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm animate-ticket-in">
        <h2 className="font-display text-xl mb-4">New Menu Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Item name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              required
              placeholder="Price"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Cost price"
              value={form.cost_price}
              onChange={(e) => updateField("cost_price", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
          </div>
          <select
            value={form.category_id}
            onChange={(e) => updateField("category_id", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          >
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm border border-ink/20 rounded-sm hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}