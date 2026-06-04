import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function PublicTree() {
  const { qrCode } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");

    apiRequest(`/tree/public/${encodeURIComponent(qrCode)}`)
      .then(setData)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [qrCode]);

  if (loading) {
    return <main className="min-h-screen bg-[#f6f8f3] px-4 py-10 text-forest">Cargando arbol...</main>;
  }

  if (error) {
    return <main className="min-h-screen bg-[#f6f8f3] px-4 py-10 text-red-700">{error}</main>;
  }

  const tree = data.tree;
  const timeline = data.timeline || [];

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <article className="card overflow-hidden">
            {tree?.imageUrl ? <img className="h-72 w-full object-cover" src={tree.imageUrl} alt={tree.species} /> : null}
            <div className="p-6">
              <p className="text-sm font-semibold text-moss">TerraBioCol QR {data.qr.code}</p>
              <h1 className="mt-1 text-3xl font-bold text-forest">{tree?.name || tree?.species || "Arbol registrado"}</h1>
              <p className="mt-2 text-sm font-semibold text-leaf">{tree?.species}</p>
              <p className="mt-4 text-stone-600">{tree?.description || "Este QR esta reservado para un arbol aun sin informacion publica."}</p>
              <dl className="mt-6 grid gap-4 text-sm text-stone-600 md:grid-cols-3">
                <div>
                  <dt className="font-semibold text-forest">Propietario</dt>
                  <dd>{data.ownerLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-forest">Ubicacion</dt>
                  <dd>{data.purchase?.location || tree?.estimatedLocation || "No asignada"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-forest">Estado</dt>
                  <dd>{data.purchase?.status || "No asignado"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-forest">CO2 estimado</dt>
                  <dd>{data.co2.estimatedKgCo2} kg</dd>
                </div>
                <div>
                  <dt className="font-semibold text-forest">CO2 capturado</dt>
                  <dd>{data.co2.accumulatedKgCo2} kg</dd>
                </div>
              </dl>
            </div>
          </article>

          <aside className="card h-fit p-5">
            {data.qr.imageUrl ? <img className="mx-auto h-48 w-48" src={data.qr.imageUrl} alt={`QR ${data.qr.code}`} /> : null}
            <p className="mt-4 break-all text-center text-xs font-semibold text-stone-500">{data.qr.publicUrl}</p>
            <span className="mt-4 block rounded-full bg-green-50 px-3 py-2 text-center text-sm font-bold text-forest">
              {data.qr.assigned ? "Asignado" : "No asignado"}
            </span>
          </aside>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-forest">Linea de tiempo</h2>
          <div className="mt-4 grid gap-4">
            {timeline.length === 0 ? <p className="card p-5 text-sm text-stone-500">Aun no hay progreso registrado.</p> : null}
            {timeline.map((event) => (
              <article className="card p-5" key={event.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-moss">
                  {new Date(event.eventDate).toLocaleDateString("es-CO")}
                </p>
                <h3 className="mt-1 text-lg font-bold text-forest">{event.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{event.description}</p>
                {event.location ? <p className="mt-2 text-sm font-semibold text-stone-700">{event.location}</p> : null}
                {event.photos?.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {event.photos.map((photo) => (
                      <figure key={photo.id}>
                        <img className="h-48 w-full rounded-lg object-cover" src={photo.imageUrl} alt={photo.caption || event.title} />
                        {photo.caption ? <figcaption className="mt-2 text-xs text-stone-500">{photo.caption}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
