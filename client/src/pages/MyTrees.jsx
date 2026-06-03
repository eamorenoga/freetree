import { useApiResource } from "../hooks/useApiResource";

export default function MyTrees() {
  const { data, loading, error } = useApiResource("/my-trees", { userTrees: [] });

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Propiedad ambiental</p>
        <h2 className="text-3xl font-bold text-forest">Mis arboles</h2>
      </div>
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p>Cargando tus arboles...</p> : null}
      <div className="grid gap-4">
        {data.userTrees.map((item) => (
          <article className="card grid gap-4 p-5 md:grid-cols-[180px_1fr]" key={item.id}>
            <img className="h-40 w-full rounded-lg object-cover" src={item.tree.imageUrl} alt={item.tree.species} />
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-forest">{item.tree.species}</h3>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{item.tree.description}</p>
              <p className="mt-3 text-sm font-semibold text-stone-700">Ubicacion: {item.location}</p>
              <p className="mt-1 text-sm text-stone-500">Eventos registrados: {item.trackingEvents.length}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
