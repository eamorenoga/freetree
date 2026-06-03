import { useState } from "react";
import MetricCard from "../components/MetricCard";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

export default function CarbonFootprint() {
  const { data, reload } = useApiResource("/carbon", { summary: { treesCount: 0, estimatedKgCo2: 0 }, records: [] });
  const [message, setMessage] = useState("");

  async function createRecord() {
    setMessage("");
    try {
      await apiRequest("/carbon", { method: "POST", body: JSON.stringify({ notes: "Calculo solicitado por el usuario" }) });
      setMessage("Calculo guardado.");
      reload();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Impacto ambiental</p>
        <h2 className="text-3xl font-bold text-forest">Huella de carbono</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Arboles considerados" value={data.summary.treesCount} />
        <MetricCard label="CO2 estimado compensado" value={`${Math.round(data.summary.estimatedKgCo2)} kg`} />
      </div>
      {message ? <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-forest">{message}</p> : null}
      <button className="btn-primary mt-5" onClick={createRecord} type="button">Guardar calculo actual</button>
      <div className="mt-6 grid gap-3">
        {data.records.map((record) => (
          <article className="card p-4" key={record.id}>
            <p className="text-sm font-bold text-forest">{Math.round(record.estimatedKgCo2)} kg CO2</p>
            <p className="text-sm text-stone-500">{record.treesCount} arboles - {new Date(record.createdAt).toLocaleDateString("es-CO")}</p>
            {record.notes ? <p className="mt-1 text-sm text-stone-600">{record.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
