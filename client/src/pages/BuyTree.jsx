import { useState } from "react";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

export default function BuyTree() {
  const { data, loading, error, reload } = useApiResource("/trees", { trees: [] });
  const [message, setMessage] = useState("");

  async function buyTree(treeId) {
    setMessage("");
    try {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({ items: [{ treeId, quantity: 1 }] })
      });
      setMessage("Compra registrada. Tu arbol ya aparece en Mis arboles.");
      reload();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Catalogo</p>
        <h2 className="text-3xl font-bold text-forest">Comprar arbol</h2>
      </div>
      {message ? <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-forest">{message}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p>Cargando catalogo...</p> : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.trees.map((tree) => (
          <article className="card overflow-hidden" key={tree.id}>
            <img className="h-48 w-full object-cover" src={tree.imageUrl} alt={tree.species} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold text-forest">{tree.species}</h3>
                <p className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-leaf">
                  ${Number(tree.price).toLocaleString("es-CO")}
                </p>
              </div>
              <p className="mt-3 text-sm text-stone-600">{tree.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                <span>{tree.estimatedCo2} kg CO2</span>
                <span>Stock {tree.stock}</span>
              </div>
              <button className="btn-primary mt-5 w-full" onClick={() => buyTree(tree.id)} disabled={tree.stock <= 0} type="button">
                Comprar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
