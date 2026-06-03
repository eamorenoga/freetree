import { useState } from "react";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

export default function Tracking() {
  const trees = useApiResource("/my-trees", { userTrees: [] });
  const events = useApiResource("/tracking", { events: [] });
  const [form, setForm] = useState({ userTreeId: "", title: "", description: "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await apiRequest("/tracking", { method: "POST", body: JSON.stringify(form) });
      setForm({ userTreeId: "", title: "", description: "" });
      setMessage("Evento registrado.");
      events.reload();
      trees.reload();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Monitoreo</p>
        <h2 className="text-3xl font-bold text-forest">Seguimiento</h2>
      </div>
      <form className="card mb-6 grid gap-4 p-5" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold text-forest">Registrar evento</h3>
        {message ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-forest">{message}</p> : null}
        <select className="field" value={form.userTreeId} onChange={(event) => setForm({ ...form, userTreeId: event.target.value })}>
          <option value="">Selecciona un arbol</option>
          {trees.data.userTrees.map((item) => (
            <option key={item.id} value={item.id}>{item.tree.species} - {item.location}</option>
          ))}
        </select>
        <input className="field" placeholder="Titulo del evento" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <textarea
          className="field min-h-24"
          placeholder="Descripcion"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="btn-primary w-fit" type="submit">Guardar evento</button>
      </form>
      <div className="grid gap-4">
        {events.data.events.map((event) => (
          <article className="card p-5" key={event.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">{new Date(event.eventDate).toLocaleDateString("es-CO")}</p>
            <h3 className="mt-1 text-lg font-bold text-forest">{event.title}</h3>
            <p className="mt-2 text-sm text-stone-600">{event.description}</p>
            <p className="mt-3 text-sm font-semibold text-stone-700">{event.userTree.tree.species}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
