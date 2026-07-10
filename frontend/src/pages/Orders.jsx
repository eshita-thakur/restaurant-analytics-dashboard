import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getOrders, createOrder, updateOrderStatus } from "../api/orders";
import { getCustomers } from "../api/customers";
import { getEmployees } from "../api/employees";
import { getItems } from "../api/menu";

const STATUS_FLOW = ["pending", "preparing", "served", "completed"];
const STATUS_COLORS = {
  pending: "bg-lavender/20 text-navy",
  preparing: "bg-sky/20 text-navy",
  served: "bg-blossom/20 text-navy",
  completed: "bg-navy/10 text-navy",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    const res = await getOrders(statusFilter || null);
    setOrders(res.data);
    setLoading(false);
  }

  async function advanceStatus(order) {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[currentIndex + 1];
    if (!next) return;
    await updateOrderStatus(order.order_id, next);
    loadOrders();
  }

  async function cancelOrder(order) {
    if (!confirm("Cancel this order?")) return;
    await updateOrderStatus(order.order_id, "cancelled");
    loadOrders();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Orders</h1>
          <p className="text-ink/60">Track and manage the floor</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
        >
          + New Order
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", ...STATUS_FLOW, "cancelled"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 text-sm rounded-full border capitalize transition-colors ${
              statusFilter === s
                ? "bg-navy text-paper border-navy"
                : "border-ink/20 text-ink/60 hover:border-lavender"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="bg-white border border-ink/10 rounded-sm p-5 animate-ticket-in"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-lavender">
                      #{order.order_id.toString().padStart(4, "0")}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink/60">
                    {order.customer_name || "Walk-in"} · {order.employee_name} ·{" "}
                    {order.order_type.replace("_", " ")}
                    {order.table_number && ` · Table ${order.table_number}`}
                  </p>
                </div>
                <span className="font-mono text-lg">₹{order.total_amount.toFixed(2)}</span>
              </div>

              <div className="text-sm text-ink/70 mb-4">
                {order.items.map((i) => (
                  <div key={i.order_item_id} className="flex justify-between py-1 border-b border-ink/5 last:border-0">
                    <span>{i.quantity} × {i.item_name}</span>
                    <span className="font-mono">₹{i.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {order.status !== "completed" && order.status !== "cancelled" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => advanceStatus(order)}
                    className="text-xs px-3 py-1.5 bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
                  >
                    Mark as {STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]}
                  </button>
                  <button
                    onClick={() => cancelOrder(order)}
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
        <NewOrderModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadOrders();
          }}
        />
      )}
    </Layout>
  );
}

function NewOrderModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState("dine_in");
  const [lineItems, setLineItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data));
    getEmployees().then((res) => setEmployees(res.data));
    getItems().then((res) => setMenuItems(res.data.filter((i) => i.is_available)));
  }, []);

  function addLineItem() {
    if (menuItems.length === 0) return;
    setLineItems((prev) => [...prev, { item_id: menuItems[0].item_id, quantity: 1 }]);
  }

  function updateLineItem(index, field, value) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === index ? { ...li, [field]: value } : li))
    );
  }

  function removeLineItem(index) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = lineItems.reduce((sum, li) => {
    const menuItem = menuItems.find((m) => m.item_id === Number(li.item_id));
    return sum + (menuItem ? menuItem.price * li.quantity : 0);
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!employeeId || lineItems.length === 0) {
      setError("Employee and at least one item are required");
      return;
    }

    try {
      await createOrder({
        employee_id: Number(employeeId),
        customer_id: customerId ? Number(customerId) : null,
        order_type: orderType,
        table_number: tableNumber || null,
        items: lineItems.map((li) => ({
          item_id: Number(li.item_id),
          quantity: Number(li.quantity),
        })),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create order");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-sm p-6 w-full max-w-lg my-8 animate-ticket-in">
        <h2 className="font-display text-xl mb-4">New Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            >
              <option value="">Employee (taking order)</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            >
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>

            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            >
              <option value="dine_in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>

            <input
              type="text"
              placeholder="Table number (optional)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
          </div>

          <div className="border-t border-ink/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Items</p>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs text-lavender hover:underline"
              >
                + Add item
              </button>
            </div>

            {lineItems.length === 0 && (
              <p className="text-sm text-ink/40 mb-3">No items added yet.</p>
            )}

            <div className="space-y-2">
              {lineItems.map((li, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={li.item_id}
                    onChange={(e) => updateLineItem(index, "item_id", e.target.value)}
                    className="flex-1 border border-ink/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-lavender"
                  >
                    {menuItems.map((m) => (
                      <option key={m.item_id} value={m.item_id}>
                        {m.name} — ₹{m.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={li.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                    className="w-16 border border-ink/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-lavender"
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-ink/40 hover:text-red-500 text-sm px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-ink/10 pt-4 font-mono">
            <span className="text-sm text-ink/60">Total</span>
            <span className="text-xl text-lavender">₹{total.toFixed(2)}</span>
          </div>

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
              Place Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}