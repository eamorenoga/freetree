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
          <article className="card grid gap-5 p-5 lg:grid-cols-[200px_1fr_180px]" key={item.id}>
            <img className="h-44 w-full rounded-lg object-cover" src={item.tree.imageUrl} alt={item.tree.species} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-forest">{item.tree.name || item.tree.species}</h3>
                  <p className="text-sm font-semibold text-moss">{item.tree.species}</p>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{item.tree.description}</p>
              <p className="mt-3 text-sm font-semibold text-stone-700">Ubicacion: {item.location}</p>
              <p className="mt-1 text-sm text-stone-500">
                CO2 estimado: {item.carbonFootprint?.estimatedKgCo2 || item.tree.estimatedCo2} kg - capturado:{" "}
                {item.carbonFootprint?.accumulatedKgCo2 || 0} kg
              </p>

              <div className="mt-5">
                <h4 className="font-bold text-forest">Linea de tiempo</h4>
                <div className="mt-3 grid gap-3">
                  {item.trackingEvents.length === 0 ? <p className="text-sm text-stone-500">Aun no hay eventos registrados.</p> : null}
                  {item.trackingEvents.map((event) => (
                    <div className="rounded-lg border border-stone-200 p-3" key={event.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-forest">{event.title}</p>
                        <p className="text-xs font-semibold text-stone-500">{new Date(event.eventDate).toLocaleDateString("es-CO")}</p>
                      </div>
                      <p className="mt-2 text-sm text-stone-600">{event.description}</p>
                      {event.location ? <p className="mt-1 text-sm font-semibold text-stone-700">{event.location}</p> : null}
                      {event.photos?.length ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {event.photos.map((photo) => (
                            <figure key={photo.id}>
                              <img className="h-36 w-full rounded-lg object-cover" src={photo.imageUrl} alt={photo.caption || event.title} />
                              {photo.caption ? <figcaption className="mt-1 text-xs text-stone-500">{photo.caption}</figcaption> : null}
                            </figure>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-lg border border-stone-200 p-3 text-center">
              {item.qrCode?.imageUrl ? (
                <img className="mx-auto h-36 w-36" src={item.qrCode.imageUrl} alt={`QR ${item.qrCode.code}`} />
              ) : (
                <p className="text-sm text-stone-500">QR no disponible</p>
              )}
              {item.qrCode ? (
                <div className="mt-3 grid gap-2">
                  <p className="break-all text-xs font-semibold text-stone-500">{item.qrCode.code}</p>
                  <a className="btn-secondary" href={item.qrCode.publicUrl} rel="noreferrer" target="_blank">
                    Ver QR
                  </a>
                  <a className="btn-primary" download={`qr-${item.qrCode.code}.png`} href={item.qrCode.imageUrl}>
                    Descargar
                  </a>
                </div>
              ) : null}
            </aside>
          </article>
        ))}
      </div>
    </section>
  );
}
