import { useState } from "react";
import MetricCard from "../components/MetricCard";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

const emptyTree = {
  species: "",
  description: "",
  price: "",
  imageUrl: "",
  estimatedCo2: "",
  stock: ""
};

export default function Admin() {
  const dashboard = useApiResource("/admin/dashboard", { stats: {}, recentOrders: [] });
  const trees = useApiResource("/admin/trees", { trees: [] });
  const [form, setForm] = useState(emptyTree);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await apiRequest("/admin/trees", { method: "POST", body: JSON.stringify(form) });
      setForm(emptyTree);
      setMessage("Arbol creado.");
      trees.reload();
      dashboard.reload();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  async function disableTree(treeId) {
    await apiRequest(`/admin/trees/${treeId}`, { method: "DELETE" });
    trees.reload();
  }

  const stats = dashboard.data.stats;

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Panel protegido</p>
        <h2 className="text-3xl font-bold text-forest">Administracion</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Usuarios" value={stats.usersCount || 0} />
        <MetricCard label="Ordenes" value={stats.ordersCount || 0} />
        <MetricCard label="Arboles vendidos/asignados" value={stats.userTreesCount || 0} />
        <MetricCard label="Ingresos" value={`$${Number(stats.revenue || 0).toLocaleString("es-CO")}`} />
      </div>
      <form className="card mt-6 grid gap-4 p-5" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold text-forest">Crear arbol</h3>
        {message ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-forest">{message}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Especie" value={form.species} onChange={(event) => setForm({ ...form, species: event.target.value })} />
          <input className="field" placeholder="URL de imagen" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          <input className="field" placeholder="Precio" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          <input className="field" placeholder="Stock" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
          <input
            className="field"
            placeholder="CO2 estimado kg"
            value={form.estimatedCo2}
            onChange={(event) => setForm({ ...form, estimatedCo2: event.target.value })}
          />
        </div>
        <textarea
          className="field min-h-24"
          placeholder="Descripcion"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="btn-primary w-fit" type="submit">Crear arbol</button>
      </form>
      <div className="mt-6 grid gap-3">
        {trees.data.trees.map((tree) => (
          <article className="card flex flex-wrap items-center justify-between gap-4 p-4" key={tree.id}>
            <div>
              <h3 className="font-bold text-forest">{tree.species}</h3>
              <p className="text-sm text-stone-500">Stock {tree.stock} - ${Number(tree.price).toLocaleString("es-CO")}</p>
            </div>
            <button className="btn-secondary" onClick={() => disableTree(tree.id)} type="button">Desactivar</button>
          </article>
        ))}
      </div>
    </section>
  );
}
