import { useState } from "react";
import MetricCard from "../components/MetricCard";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

export default function CarbonFootprint() {
  const { data, reload } = useApiResource("/carbon", {
    summary: {
      treesCount: 0,
      activeTreesCount: 0,
      monthlyKgCo2: 0,
      annualKgCo2: 0,
      accumulatedKgCo2: 0,
      equivalences: { compensatedCarKm: 0, compensatedEnergyKwh: 0, activeTreesCount: 0 },
      disclaimer: ""
    },
    trees: [],
    records: []
  });
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
        <MetricCard label="Arboles activos" value={data.summary.activeTreesCount || data.summary.treesCount} />
        <MetricCard label="CO2 mensual estimado" value={`${Math.round(data.summary.monthlyKgCo2)} kg`} />
        <MetricCard label="CO2 anual estimado" value={`${Math.round(data.summary.annualKgCo2)} kg`} />
        <MetricCard label="CO2 acumulado estimado" value={`${Math.round(data.summary.accumulatedKgCo2)} kg`} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard label="Km en carro compensados" value={`${Math.round(data.summary.equivalences.compensatedCarKm)} km`} />
        <MetricCard label="Energia compensada" value={`${Math.round(data.summary.equivalences.compensatedEnergyKwh)} kWh`} />
        <MetricCard label="Arboles activos" value={data.summary.equivalences.activeTreesCount} />
      </div>
      <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {data.summary.disclaimer ||
          "Este calculo es estimado y sirve como referencia informativa. No reemplaza una certificacion ambiental oficial."}
      </p>
      {message ? <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-forest">{message}</p> : null}
      <button className="btn-primary mt-5" onClick={createRecord} type="button">Guardar calculo actual</button>

      <section className="mt-6">
        <h3 className="text-xl font-bold text-forest">Impacto por arbol</h3>
        <div className="mt-3 grid gap-4">
          {data.trees.map((treeImpact) => (
            <article className="card p-4" key={treeImpact.purchaseId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-forest">{treeImpact.treeName || treeImpact.species}</h4>
                  <p className="text-sm font-semibold text-moss">{treeImpact.species} - {treeImpact.status}</p>
                </div>
                <p className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-leaf">
                  {Math.round(treeImpact.accumulatedKgCo2)} kg acumulados
                </p>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-4">
                <div>
                  <p className="font-semibold text-forest">Mensual</p>
                  <p>{treeImpact.monthlyKgCo2.toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="font-semibold text-forest">Anual</p>
                  <p>{treeImpact.annualKgCo2.toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="font-semibold text-forest">Edad</p>
                  <p>{treeImpact.ageMonths} meses</p>
                </div>
                <div>
                  <p className="font-semibold text-forest">Formula</p>
                  <p>
                    {treeImpact.formula.speciesFactor.toFixed(1)} x {treeImpact.ageMonths} x{" "}
                    {treeImpact.formula.healthFactor.toFixed(2)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-3">
        {data.records.map((record) => (
          <article className="card p-4" key={record.id}>
            <p className="text-sm font-bold text-forest">{Math.round(record.accumulatedKgCo2)} kg CO2 acumulados</p>
            <p className="text-sm text-stone-500">
              {record.treesCount ? `${record.treesCount} arbol` : "Impacto total"} - {new Date(record.createdAt).toLocaleDateString("es-CO")}
            </p>
            {record.notes ? <p className="mt-1 text-sm text-stone-600">{record.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
