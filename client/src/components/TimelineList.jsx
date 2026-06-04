import { resolveMediaUrl } from "../lib/api";

export default function TimelineList({ events = [], emptyText = "Aun no hay eventos registrados." }) {
  if (!events.length) {
    return <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">{emptyText}</p>;
  }

  return (
    <div className="relative grid gap-4 pl-5">
      <div className="absolute bottom-2 left-2 top-2 w-px bg-green-200" />
      {events.map((event) => (
        <article className="relative rounded-lg border border-stone-200 bg-white p-4 shadow-sm" key={event.id}>
          <span className="absolute -left-[1.05rem] top-5 h-3 w-3 rounded-full border-2 border-white bg-leaf shadow" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-forest">{event.title}</h4>
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">
              {new Date(event.eventDate).toLocaleDateString("es-CO")}
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-600">{event.description}</p>
          {event.location ? <p className="mt-2 text-sm font-semibold text-stone-700">{event.location}</p> : null}
          {event.photos?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {event.photos.map((photo) => (
                <figure key={photo.id}>
                  <img className="h-40 w-full rounded-lg object-cover" src={resolveMediaUrl(photo.imageUrl)} alt={photo.caption || event.title} />
                  {photo.caption ? <figcaption className="mt-1 text-xs text-stone-500">{photo.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
