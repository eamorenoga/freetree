import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

const emptyBuyer = {
  name: "",
  email: "",
  password: ""
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, setSession } = useAuth();
  const { data, loading, error } = useApiResource("/trees", { trees: [] });
  const [selectedTreeId, setSelectedTreeId] = useState("");
  const [buyer, setBuyer] = useState(emptyBuyer);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedTree = useMemo(
    () => data.trees.find((tree) => tree.id === selectedTreeId) || data.trees[0],
    [data.trees, selectedTreeId]
  );

  async function handlePublicPurchase(event) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await apiRequest("/orders/public-checkout", {
        method: "POST",
        body: JSON.stringify({
          ...buyer,
          items: [{ treeId: selectedTree.id, quantity: 1 }],
          paymentStatus: "APPROVED"
        })
      });
      setSession({ token: response.token, user: response.user });
      navigate("/app/mis-arboles");
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3]">
      <section className="relative min-h-[82vh] overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1800&q=80"
          alt="Bosque protegido"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/70 to-forest/20" />
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 text-white lg:px-8">
          <Link className="text-xl font-bold" to="/">TerraBioCol</Link>
          <div className="flex items-center gap-3">
            {user ? <Link className="btn-secondary border-white/40 bg-white/10 text-white hover:bg-white hover:text-forest" to="/app">Mi cuenta</Link> : null}
            <Link className="btn-primary bg-white text-forest hover:bg-green-50" to="/login">Iniciar sesion</Link>
          </div>
        </header>
        <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-16 text-white lg:grid-cols-[1fr_24rem] lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-100">Venta, seguimiento y monitoreo ambiental</p>
            <h1 className="mt-4 text-5xl font-bold leading-tight lg:text-6xl">Compra un arbol y sigue su impacto desde el primer dia</h1>
            <p className="mt-5 max-w-2xl text-lg text-green-50">
              Personas y empresas pueden sembrar, monitorear crecimiento, consultar captura estimada de CO2 y descargar evidencia digital con QR.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-semibold sm:grid-cols-3">
              <span className="rounded-lg bg-white/15 px-4 py-3">QR publico por arbol</span>
              <span className="rounded-lg bg-white/15 px-4 py-3">Fotos y linea de tiempo</span>
              <span className="rounded-lg bg-white/15 px-4 py-3">Impacto ambiental estimado</span>
            </div>
          </div>
          <form className="card bg-white/95 p-5 text-forest shadow-xl" onSubmit={handlePublicPurchase}>
            <p className="text-sm font-semibold text-moss">Compra visible</p>
            <h2 className="mt-1 text-2xl font-bold">Adquiere tu arbol</h2>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
            <label className="mt-4 block text-sm font-semibold">Arbol</label>
            <select className="field mt-2" value={selectedTree?.id || ""} onChange={(event) => setSelectedTreeId(event.target.value)}>
              {loading ? <option>Cargando catalogo...</option> : null}
              {data.trees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.name || tree.species} - ${Number(tree.price).toLocaleString("es-CO")}
                </option>
              ))}
            </select>
            {selectedTree ? (
              <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-stone-700">
                <p className="font-bold text-forest">{selectedTree.species}</p>
                <p>{selectedTree.estimatedCo2} kg CO2/ano - {selectedTree.estimatedLocation}</p>
              </div>
            ) : null}
            <label className="mt-4 block text-sm font-semibold">Nombre</label>
            <input className="field mt-2" value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} />
            <label className="mt-4 block text-sm font-semibold">Correo</label>
            <input className="field mt-2" type="email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} />
            <label className="mt-4 block text-sm font-semibold">Crea una contrasena</label>
            <input
              className="field mt-2"
              type="password"
              value={buyer.password}
              onChange={(event) => setBuyer({ ...buyer, password: event.target.value })}
            />
            <button className="btn-primary mt-5 w-full" disabled={!selectedTree || submitting} type="submit">
              {submitting ? "Registrando compra..." : "Comprar y crear cuenta"}
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">Pago mock aprobado para demostracion. La pasarela queda lista para proveedor real.</p>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {[
          ["Venta directa", "Compra arboles para compensacion ambiental individual o empresarial."],
          ["Monitoreo", "Consulta estado, ubicacion, fotos y progreso por linea de tiempo."],
          ["Impacto", "Revisa CO2 mensual, anual, acumulado y equivalencias simples."],
          ["Certificados digitales", "Accede al QR publico y evidencia descargable de tus arboles."]
        ].map(([title, description]) => (
          <article className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md" key={title}>
            <h3 className="font-bold text-forest">{title}</h3>
            <p className="mt-2 text-sm text-stone-600">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
