import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { to: "/app", label: "Inicio", shortLabel: "Inicio" },
  { to: "/app/comprar-arbol", label: "Comprar arbol", shortLabel: "Comprar" },
  { to: "/app/mis-arboles", label: "Mis arboles", shortLabel: "Arboles" },
  { to: "/app/seguimiento", label: "Seguimiento", shortLabel: "Monitoreo" },
  { to: "/app/huella-carbono", label: "Huella de carbono", shortLabel: "CO2" },
  { to: "/app/perfil", label: "Perfil", shortLabel: "Perfil" },
  { to: "/app/admin", label: "Administracion", shortLabel: "Admin", adminOnly: true }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f5f7f0] pb-20 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-stone-200 bg-white px-5 py-6 shadow-sm lg:block">
        <div className="mb-8">
          <p className="eyebrow">TerraBioCol</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-forest">Bosques medibles</h1>
          <p className="mt-2 text-sm text-stone-500">Venta, monitoreo e impacto ambiental.</p>
        </div>
        <nav className="grid gap-2">
          {menuItems
            .filter((item) => !item.adminOnly || user?.role === "ADMIN")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActive ? "bg-forest text-white shadow-sm" : "text-stone-600 hover:bg-green-50 hover:text-forest"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-lg bg-green-50 p-4">
          <p className="text-sm font-bold text-forest">{user?.name}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">{user?.role}</p>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-forest">Hola, {user?.name}</p>
              <p className="text-xs text-stone-500">Gestiona tus arboles y evidencia ambiental</p>
            </div>
            <button className="btn-secondary" onClick={handleLogout} type="button">
              Cerrar sesion
            </button>
          </div>
        </header>
        <main className="section-shell">
          <Outlet />
        </main>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-lg border border-stone-200 bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden">
        {menuItems
          .filter((item) => (!item.adminOnly || user?.role === "ADMIN") && item.to !== "/app/perfil")
          .slice(0, 5)
          .map((item) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-lg px-2 py-2 text-center text-[11px] font-bold ${
                  isActive ? "bg-forest text-white" : "text-stone-600 hover:bg-green-50 hover:text-forest"
                }`
              }
              end={item.to === "/app"}
              key={item.to}
              to={item.to}
            >
              {item.shortLabel}
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
