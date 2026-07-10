import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api/employees";

const STATUS_COLORS = {
  active: "bg-sky/20 text-navy",
  on_leave: "bg-lavender/20 text-navy",
  terminated: "bg-ink/10 text-ink/50",
};

export default function Employees() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    const res = await getEmployees();
    setEmployees(res.data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this employee? This cannot be undone.")) return;
    await deleteEmployee(id);
    loadEmployees();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Employees</h1>
          <p className="text-ink/60">Your team</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors"
        >
          + New Employee
        </button>
      </div>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading employees...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white border border-dashed border-ink/20 rounded-sm p-12 text-center text-ink/40">
          No employees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.employee_id} className="bg-white border border-ink/10 rounded-sm p-5 animate-ticket-in">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-lg">{emp.first_name} {emp.last_name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[emp.status]}`}>
                  {emp.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-ink/60 mb-1">{emp.position}</p>
              <p className="text-sm text-ink/50 mb-4">{emp.phone || "No phone on file"}</p>

              <div className="flex items-center justify-between pt-4 border-t border-ink/10">
                <span className="font-mono text-sm text-lavender">
                  ₹{emp.salary.toLocaleString()}/mo
                </span>
                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => { setEditingEmployee(emp); setShowForm(true); }}
                    className="text-ink/50 hover:text-lavender transition-colors"
                  >
                    Edit
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(emp.employee_id)}
                      className="text-ink/50 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadEmployees(); }}
        />
      )}
    </Layout>
  );
}

function EmployeeFormModal({ employee, onClose, onSaved }) {
  const isEditing = Boolean(employee);
  const [form, setForm] = useState({
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    phone: employee?.phone || "",
    position: employee?.position || "",
    salary: employee?.salary || "",
    hire_date: employee?.hire_date || new Date().toISOString().split("T")[0],
    status: employee?.status || "active",
  });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, salary: parseFloat(form.salary) };
      if (isEditing) {
        await updateEmployee(employee.employee_id, payload);
      } else {
        await createEmployee(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save employee");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-sm p-6 w-full max-w-sm my-8 animate-ticket-in">
        <h2 className="font-display text-xl mb-4">{isEditing ? "Edit Employee" : "New Employee"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text" required placeholder="First name"
              value={form.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
            <input
              type="text" required placeholder="Last name"
              value={form.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
          </div>
          <input
            type="text" placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <input
            type="text" required placeholder="Position (e.g. Head Chef)"
            value={form.position}
            onChange={(e) => updateField("position", e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
          />
          <div className="flex gap-3">
            <input
              type="number" step="0.01" required placeholder="Monthly salary"
              value={form.salary}
              onChange={(e) => updateField("salary", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
            <input
              type="date" required
              value={form.hire_date}
              onChange={(e) => updateField("hire_date", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            />
          </div>
          {isEditing && (
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full border border-ink/20 rounded-sm px-3 py-2 focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            >
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="terminated">Terminated</option>
            </select>
          )}
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