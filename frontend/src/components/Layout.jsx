import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Menu", path: "/menu" },
  { label: "Orders", path: "/orders" },
  { label: "Customers", path: "/customers" },
  { label: "Employees", path: "/employees" },
  { label: "Inventory", path: "/inventory" },
  { label: "Suppliers", path: "/suppliers" },
  { label: "Reservations", path: "/reservations" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="w-60 bg-navy text-paper flex flex-col shrink-0">
        <div className="p-6 font-display text-xl border-b border-paper/10">
          Bloom & Table
        </div>

        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-6 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-paper/10 text-blossom border-r-2 border-blossom"
                    : "text-paper/70 hover:text-paper hover:bg-paper/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-paper/10">
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs text-paper/50 capitalize mb-3">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-paper/60 hover:text-blossom transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}