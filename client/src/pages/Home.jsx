import MetricCard from "../components/MetricCard";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";

export default function Home() {
  const { user } = useAuth();
  const carbon = useApiResource("/carbon", { summary: { treesCount: 0, estimatedKgCo2: 0 } });
  const myTrees = useApiResource("/my-trees", { userTrees: [] });

  if (user?.role === "ADMIN") {
    return <AdminHome />;
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Dashboard cliente</p>
        <h2 className="text-3xl font-bold text-forest">Tu bosque personal</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Arboles adquiridos" value={myTrees.data.userTrees.length} detail="Asignados a tu cuenta" />
        <MetricCard label="CO2 estimado" value={`${Math.round(carbon.data.summary.estimatedKgCo2)} kg`} detail="Compensacion proyectada" />
        <MetricCard label="Eventos" value={myTrees.data.userTrees.reduce((sum, item) => sum + item.trackingEvents.length, 0)} detail="Seguimientos registrados" />
      </div>
      <div className="card mt-6 overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="text-xl font-bold text-forest">Compra, monitorea y compensa</h3>
            <p className="mt-3 text-stone-600">
              TerraBioCol conecta compradores con proyectos de restauracion. Cada compra crea un arbol asignado,
              habilita seguimiento y suma captura estimada de carbono.
            </p>
          </div>
          <img
            className="h-56 w-full rounded-lg object-cover"
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80"
            alt="Bosque colombiano"
          />
        </div>
      </div>
    </section>
  );
}

function AdminHome() {
  const dashboard = useApiResource("/admin/dashboard", { stats: {}, recentOrders: [] });
  const stats = dashboard.data.stats;

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Dashboard administrador</p>
        <h2 className="text-3xl font-bold text-forest">Operacion TerraBioCol</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Usuarios" value={stats.usersCount || 0} />
        <MetricCard label="Ventas" value={stats.ordersCount || 0} />
        <MetricCard label="Arboles catalogo" value={stats.treesCount || 0} />
        <MetricCard label="Ingresos" value={`$${Number(stats.revenue || 0).toLocaleString("es-CO")}`} />
      </div>
    </section>
  );
}
