import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import TimelineList from "../components/TimelineList";
import { apiRequest } from "../lib/api";

const emptyProgress = {
  title: "Revision de campo",
  description: "",
  location: "",
  status: "GROWING",
  photoData: "",
  photoMimeType: "",
  fileName: ""
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Operator() {
  const [qrSearch, setQrSearch] = useState("");
  const [qrResult, setQrResult] = useState(null);
  const [progressForm, setProgressForm] = useState(emptyProgress);
  const [scannerActive, setScannerActive] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const scannerTimerRef = useRef(null);
  const scannerStreamRef = useRef(null);

  useEffect(() => () => stopScanner(), []);

  function normalizeScannedValue(rawValue) {
    return decodeURIComponent(rawValue?.split("/tree/public/")[1] || rawValue || "").trim();
  }

  async function searchQr(event) {
    event?.preventDefault();
    setMessage("");
    setQrResult(null);

    try {
      const response = await apiRequest(`/operator/qr/${encodeURIComponent(qrSearch.trim())}`);
      setQrResult(response.qr);
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
      setMessage("Este navegador no soporta escaneo QR nativo. Ingresa el codigo manualmente.");
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
        if (!videoRef.current) return;

        const codes = await detector.detect(videoRef.current);
        const scannedCode = normalizeScannedValue(codes[0]?.rawValue);

        if (scannedCode) {
          setQrSearch(scannedCode);
          stopScanner();
        }
      }, 900);
    } catch (_error) {
      setMessage("No fue posible abrir la camara. Ingresa el codigo QR manualmente.");
      stopScanner();
    }
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setProgressForm({ ...progressForm, photoData: "", photoMimeType: "", fileName: "" });
      return;
    }

    const photoData = await readFileAsDataUrl(file);
    setProgressForm({ ...progressForm, photoData, photoMimeType: file.type, fileName: file.name });
  }

  async function submitProgress(event) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      await apiRequest(`/operator/qr/${encodeURIComponent(qrResult.code)}/progress`, {
        method: "POST",
        body: JSON.stringify(progressForm)
      });
      setProgressForm(emptyProgress);
      setMessage("Progreso guardado en la trazabilidad del arbol.");
      const refreshedQr = await apiRequest(`/operator/qr/${encodeURIComponent(qrResult.code)}`);
      setQrResult(refreshedQr.qr);
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const tree = qrResult?.treePurchase?.treeProduct || qrResult?.treeProduct;

  return (
    <section>
      <PageHeader
        eyebrow="Operario de campo"
        title="Escaneo y seguimiento"
        description="Escanea el QR del arbol desde el celular, toma una foto y registra como esta creciendo."
      />
      {message ? <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-forest">{message}</p> : null}

      <section className="card grid gap-4 p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={searchQr}>
          <input
            className="field"
            placeholder="Codigo QR o URL publica"
            value={qrSearch}
            onChange={(event) => setQrSearch(normalizeScannedValue(event.target.value))}
          />
          <button className="btn-secondary" onClick={scannerActive ? stopScanner : startScanner} type="button">
            {scannerActive ? "Detener camara" : "Escanear QR"}
          </button>
          <button className="btn-primary" type="submit">Buscar</button>
        </form>
        {scannerActive ? <video className="h-72 w-full rounded-lg bg-black object-cover" muted playsInline ref={videoRef} /> : null}
      </section>

      {qrResult ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section className="card overflow-hidden">
            {tree?.imageUrl ? <img className="h-56 w-full object-cover" src={tree.imageUrl} alt={tree.species} /> : null}
            <div className="p-5">
              <p className="text-sm font-semibold text-moss">{qrResult.code}</p>
              <h3 className="mt-1 text-2xl font-bold text-forest">{tree?.name || tree?.species || "Arbol registrado"}</h3>
              <p className="mt-2 text-sm text-stone-600">{tree?.species}</p>
              <p className="mt-3 text-sm font-semibold text-stone-700">
                Estado: {qrResult.treePurchase?.status || "No asignado"} - {qrResult.treePurchase?.location || tree?.estimatedLocation}
              </p>
              {qrResult.treePurchase?.user ? (
                <p className="mt-1 text-sm text-stone-500">Cliente: {qrResult.treePurchase.user.name}</p>
              ) : null}
            </div>
          </section>

          <form className="card grid h-fit gap-4 p-5" onSubmit={submitProgress}>
            <h3 className="text-lg font-bold text-forest">Nuevo progreso</h3>
            {!qrResult.treePurchase ? <p className="text-sm text-stone-500">Este QR aun no esta asignado a una compra.</p> : null}
            <input
              className="field"
              disabled={!qrResult.treePurchase}
              placeholder="Titulo"
              value={progressForm.title}
              onChange={(event) => setProgressForm({ ...progressForm, title: event.target.value })}
            />
            <select
              className="field"
              disabled={!qrResult.treePurchase}
              value={progressForm.status}
              onChange={(event) => setProgressForm({ ...progressForm, status: event.target.value })}
            >
              <option value="PLANTED">Plantado</option>
              <option value="GROWING">Creciendo</option>
              <option value="HEALTHY">Saludable</option>
              <option value="NEEDS_ATTENTION">Requiere atencion</option>
              <option value="MATURE">Maduro</option>
            </select>
            <input
              className="field"
              disabled={!qrResult.treePurchase}
              placeholder="Ubicacion o lote"
              value={progressForm.location}
              onChange={(event) => setProgressForm({ ...progressForm, location: event.target.value })}
            />
            <textarea
              className="field min-h-28"
              disabled={!qrResult.treePurchase}
              placeholder="Describe crecimiento, follaje, humedad, salud o novedades"
              value={progressForm.description}
              onChange={(event) => setProgressForm({ ...progressForm, description: event.target.value })}
            />
            <input
              accept="image/*"
              capture="environment"
              className="field"
              disabled={!qrResult.treePurchase}
              onChange={handlePhoto}
              type="file"
            />
            {progressForm.fileName ? <p className="text-sm font-semibold text-moss">Foto lista: {progressForm.fileName}</p> : null}
            <button className="btn-primary" disabled={!qrResult.treePurchase || submitting} type="submit">
              {submitting ? "Guardando..." : "Guardar trazabilidad"}
            </button>
          </form>
        </div>
      ) : null}

      {qrResult?.treePurchase ? (
        <section className="mt-6">
          <h3 className="mb-3 text-xl font-bold text-forest">Trazabilidad del arbol</h3>
          <TimelineList events={qrResult.treePurchase.trackingEvents} />
        </section>
      ) : null}
    </section>
  );
}
