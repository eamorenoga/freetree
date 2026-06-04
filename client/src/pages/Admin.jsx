import { useEffect, useRef, useState } from "react";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

const emptyTree = {
  name: "",
  species: "",
  description: "",
  price: "",
  imageUrl: "",
  estimatedLocation: "",
  estimatedCo2: "",
  co2FactorPerMonth: "",
  stock: ""
};

const emptyProgress = {
  title: "",
  description: "",
  imageUrl: "",
  photoData: "",
  photoMimeType: "",
  fileName: "",
  location: "",
  status: "GROWING"
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Admin() {
  const dashboard = useApiResource("/admin/dashboard", { stats: {}, recentOrders: [] });
  const trees = useApiResource("/admin/trees", { trees: [] });
  const [form, setForm] = useState(emptyTree);
  const [qrSearch, setQrSearch] = useState("");
  const [qrResult, setQrResult] = useState(null);
  const [progressForm, setProgressForm] = useState(emptyProgress);
  const [scannerActive, setScannerActive] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef(null);
  const scannerTimerRef = useRef(null);
  const scannerStreamRef = useRef(null);

  useEffect(() => () => stopScanner(), []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await apiRequest("/admin/trees", { method: "POST", body: JSON.stringify(form) });
      setForm(emptyTree);
      setMessage("Arbol creado.");
      trees.reload();
      dashboard.reload();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  async function disableTree(treeId) {
    await apiRequest(`/admin/trees/${treeId}`, { method: "DELETE" });
    trees.reload();
  }

  async function generateInitialQr(treeId) {
    setMessage("");
    try {
      const response = await apiRequest(`/admin/trees/${treeId}/qr`, { method: "POST" });
      setQrResult(response.qr);
      setQrSearch(response.qr.code);
      setMessage("QR inicial generado.");
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  async function searchQr(event) {
    event?.preventDefault();
    setMessage("");
    setQrResult(null);

    try {
      const response = await apiRequest(`/admin/qr/${encodeURIComponent(qrSearch.trim())}`);
      setQrResult(response.qr);
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  async function submitProgress(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await apiRequest(`/admin/qr/${encodeURIComponent(qrResult.code)}/progress`, {
        method: "POST",
        body: JSON.stringify(progressForm)
      });
      setProgressForm(emptyProgress);
      setMessage("Progreso registrado.");
      const refreshedQr = await apiRequest(`/admin/qr/${encodeURIComponent(qrResult.code)}`);
      setQrResult(refreshedQr.qr);
      return response;
    } catch (requestError) {
      setMessage(requestError.message);
    }
  }

  function stopScanner() {
    window.clearInterval(scannerTimerRef.current);
    scannerStreamRef.current?.getTracks().forEach((track) => track.stop());
    scannerTimerRef.current = null;
    scannerStreamRef.current = null;
    setScannerActive(false);
  }

  async function startScanner() {
    setMessage("");

    if (!("BarcodeDetector" in window)) {
      setMessage("El navegador no soporta escaneo QR nativo. Ingresa el codigo manualmente.");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      scannerStreamRef.current = stream;
      setScannerActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scannerTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) {
          return;
        }

        const codes = await detector.detect(videoRef.current);
        const rawValue = codes[0]?.rawValue;
        const scannedCode = rawValue?.split("/tree/public/")[1] || rawValue;

        if (scannedCode) {
          setQrSearch(decodeURIComponent(scannedCode));
          stopScanner();
        }
      }, 900);
    } catch (_error) {
      setMessage("No fue posible abrir la camara. Ingresa el codigo QR manualmente.");
      stopScanner();
    }
  }

  async function handleProgressPhoto(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setProgressForm({ ...progressForm, photoData: "", photoMimeType: "", fileName: "" });
      return;
    }

    const photoData = await readFileAsDataUrl(file);
    setProgressForm({
      ...progressForm,
      photoData,
      photoMimeType: file.type,
      fileName: file.name
    });
  }

  const stats = dashboard.data.stats;

  return (
    <section>
      <PageHeader
        eyebrow="Panel protegido"
        title="Administracion"
        description="Administra catalogo, QR, seguimiento, fotos y metricas de la operacion."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Usuarios" value={stats.usersCount || 0} />
        <MetricCard label="Ordenes" value={stats.ordersCount || 0} />
        <MetricCard label="Arboles vendidos/asignados" value={stats.userTreesCount || 0} />
        <MetricCard label="Ingresos" value={`$${Number(stats.revenue || 0).toLocaleString("es-CO")}`} />
      </div>
      <form className="card mt-6 grid gap-4 p-5" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold text-forest">Cargar arbol al catalogo</h3>
        {message ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-forest">{message}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Nombre comercial" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="field" placeholder="Especie" value={form.species} onChange={(event) => setForm({ ...form, species: event.target.value })} />
          <input className="field" placeholder="URL de imagen" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          <input
            className="field"
            placeholder="Ubicacion estimada"
            value={form.estimatedLocation}
            onChange={(event) => setForm({ ...form, estimatedLocation: event.target.value })}
          />
          <input
            className="field"
            min="0"
            placeholder="Precio"
            type="number"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
          />
          <input
            className="field"
            min="0"
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
          />
          <input
            className="field"
            min="0"
            placeholder="CO2 estimado kg por ano"
            type="number"
            value={form.estimatedCo2}
            onChange={(event) => setForm({ ...form, estimatedCo2: event.target.value })}
          />
          <input
            className="field"
            min="0"
            placeholder="Factor CO2 especie kg/mes"
            step="0.1"
            type="number"
            value={form.co2FactorPerMonth}
            onChange={(event) => setForm({ ...form, co2FactorPerMonth: event.target.value })}
          />
        </div>
        <textarea
          className="field min-h-24"
          placeholder="Descripcion"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="btn-primary w-fit" type="submit">Cargar arbol</button>
      </form>
      <section className="card mt-6 grid gap-4 p-5">
        <div>
          <p className="text-sm font-semibold text-moss">QR de arboles</p>
          <h3 className="text-lg font-bold text-forest">Buscar o escanear QR</h3>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={searchQr}>
          <input
            className="field"
            placeholder="Codigo QR o TBC-..."
            value={qrSearch}
            onChange={(event) => setQrSearch(event.target.value)}
          />
          <button className="btn-secondary" onClick={scannerActive ? stopScanner : startScanner} type="button">
            {scannerActive ? "Detener escaner" : "Escanear"}
          </button>
          <button className="btn-primary" type="submit">Buscar</button>
        </form>
        {scannerActive ? <video className="h-56 w-full rounded-lg bg-black object-cover" muted playsInline ref={videoRef} /> : null}
        {qrResult ? (
          <div className="rounded-lg border border-stone-200 p-4">
            <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
              {qrResult.imageUrl ? <img className="h-44 w-44" src={qrResult.imageUrl} alt={`QR ${qrResult.code}`} /> : null}
              <div>
                <p className="break-all text-sm font-bold text-forest">{qrResult.code}</p>
                <p className="break-all text-xs text-stone-500">{qrResult.publicUrl}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {qrResult.treePurchase ? "Asignado a compra" : "No asignado a compra"}
                </p>
                <p className="text-sm font-semibold text-moss">
                  {qrResult.treePurchase?.treeProduct?.species || qrResult.treeProduct?.species || "Sin arbol"}
                </p>
                {qrResult.treePurchase?.user ? (
                  <p className="text-sm text-stone-600">Dueno: {qrResult.treePurchase.user.name}</p>
                ) : null}
              </div>
            </div>

            <form className="mt-5 grid gap-3" onSubmit={submitProgress}>
              <h4 className="font-bold text-forest">Subir nuevo progreso</h4>
              {!qrResult.treePurchase ? <p className="text-sm text-stone-500">Este QR aun no tiene compra asignada.</p> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="field"
                  disabled={!qrResult.treePurchase}
                  placeholder="Titulo"
                  value={progressForm.title}
                  onChange={(event) => setProgressForm({ ...progressForm, title: event.target.value })}
                />
                <input
                  className="field"
                  disabled={!qrResult.treePurchase}
                  placeholder="Ubicacion"
                  value={progressForm.location}
                  onChange={(event) => setProgressForm({ ...progressForm, location: event.target.value })}
                />
                <input
                  className="field"
                  disabled={!qrResult.treePurchase}
                  placeholder="URL de foto opcional"
                  value={progressForm.imageUrl}
                  onChange={(event) => setProgressForm({ ...progressForm, imageUrl: event.target.value })}
                />
                <select
                  className="field"
                  disabled={!qrResult.treePurchase}
                  value={progressForm.status}
                  onChange={(event) => setProgressForm({ ...progressForm, status: event.target.value })}
                >
                  <option value="PURCHASED">Comprado</option>
                  <option value="PLANTED">Plantado</option>
                  <option value="GROWING">Creciendo</option>
                  <option value="HEALTHY">Saludable</option>
                  <option value="NEEDS_ATTENTION">Requiere atencion</option>
                  <option value="MATURE">Maduro</option>
                </select>
              </div>
              <input
                accept="image/*"
                className="field"
                disabled={!qrResult.treePurchase}
                onChange={handleProgressPhoto}
                type="file"
              />
              {progressForm.fileName ? <p className="text-sm font-semibold text-moss">Foto lista para guardar en base de datos: {progressForm.fileName}</p> : null}
              <textarea
                className="field min-h-24"
                disabled={!qrResult.treePurchase}
                placeholder="Descripcion del progreso"
                value={progressForm.description}
                onChange={(event) => setProgressForm({ ...progressForm, description: event.target.value })}
              />
              <button className="btn-primary w-fit" disabled={!qrResult.treePurchase} type="submit">Guardar progreso</button>
            </form>
          </div>
        ) : null}
      </section>
      <div className="mt-6 grid gap-3">
        {trees.data.trees.map((tree) => (
          <article className="card flex flex-wrap items-center justify-between gap-4 p-4" key={tree.id}>
            <div>
              <h3 className="font-bold text-forest">{tree.name || tree.species}</h3>
              <p className="text-sm font-semibold text-moss">{tree.species}</p>
              <p className="text-sm text-stone-500">
                Stock {tree.stock} - ${Number(tree.price).toLocaleString("es-CO")} - {tree.estimatedKgCo2PerYear} kg CO2/ano
              </p>
              <p className="text-sm text-stone-500">Factor especie: {tree.co2FactorPerMonth || 0} kg CO2/mes</p>
              <p className="text-sm text-stone-500">{tree.estimatedLocation}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => generateInitialQr(tree.id)} type="button">Generar QR</button>
              <button className="btn-secondary" onClick={() => disableTree(tree.id)} type="button">Desactivar</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
