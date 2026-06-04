import { useState } from "react";
import PageHeader from "../components/PageHeader";
import TimelineList from "../components/TimelineList";
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
      <PageHeader
        eyebrow="Monitoreo"
        title="Seguimiento"
        description="Registra avances y consulta la linea de tiempo visual de tus arboles."
      />
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
      <TimelineList events={events.data.events} />
    </section>
  );
}
