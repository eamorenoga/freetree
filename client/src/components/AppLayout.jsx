import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { to: "/", label: "Inicio" },
  { to: "/comprar-arbol", label: "Comprar arbol" },
  { to: "/mis-arboles", label: "Mis arboles" },
  { to: "/seguimiento", label: "Seguimiento" },
  { to: "/huella-carbono", label: "Huella de carbono" },
  { to: "/perfil", label: "Perfil" },
  { to: "/admin", label: "Administracion", adminOnly: true }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f8f3]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-stone-200 bg-white px-5 py-6 lg:block">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">TerraBioCol</p>
          <h1 className="mt-2 text-2xl font-bold text-forest">Bosques medibles</h1>
        </div>
        <nav className="grid gap-2">
          {menuItems
            .filter((item) => !item.adminOnly || user?.role === "ADMIN")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold ${
                    isActive ? "bg-forest text-white" : "text-stone-600 hover:bg-stone-100 hover:text-forest"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">Hola, {user?.name}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf">{user?.role}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:hidden">
              {menuItems
                .filter((item) => !item.adminOnly || user?.role === "ADMIN")
                .map((item) => (
                  <NavLink key={item.to} to={item.to} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-forest">
                    {item.label}
                  </NavLink>
                ))}
            </div>
            <button className="btn-secondary" onClick={handleLogout} type="button">
              Cerrar sesion
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
