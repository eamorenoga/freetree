export default function TreeCard({ tree, children, compact = false }) {
  return (
    <article className="card group overflow-hidden">
      <div className="relative">
        <img
          className={`${compact ? "h-40" : "h-52"} w-full object-cover transition duration-300 group-hover:scale-[1.02]`}
          src={tree.imageUrl}
          alt={tree.species}
        />
        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-forest shadow-sm">
          ${Number(tree.price || 0).toLocaleString("es-CO")}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-forest">{tree.name || tree.species}</h3>
            <p className="text-sm font-semibold text-moss">{tree.species}</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">Stock {tree.stock}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-600">{tree.description}</p>
        <dl className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-forest">Ubicacion</dt>
            <dd>{tree.estimatedLocation}</dd>
          </div>
          <div>
            <dt className="font-semibold text-forest">CO2</dt>
            <dd>{tree.estimatedCo2 || tree.estimatedKgCo2PerYear} kg/ano</dd>
          </div>
        </dl>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </article>
  );
}
