import { useMemo, useState } from "react";
import { useApiResource } from "../hooks/useApiResource";
import { apiRequest } from "../lib/api";

const mockPaymentStatuses = [
  { value: "APPROVED", label: "Aprobado" },
  { value: "PENDING", label: "Pendiente" },
  { value: "REJECTED", label: "Rechazado" }
];

export default function BuyTree() {
  const { data, loading, error, reload } = useApiResource("/trees", { trees: [] });
  const [cartItems, setCartItems] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("APPROVED");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const cartDetails = useMemo(
    () =>
      cartItems
        .map((cartItem) => {
          const tree = data.trees.find((candidate) => candidate.id === cartItem.treeId);
          return tree ? { ...cartItem, tree } : null;
        })
        .filter(Boolean),
    [cartItems, data.trees]
  );

  const cartTotal = cartDetails.reduce((sum, item) => sum + Number(item.tree.price) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(treeId) {
    setMessage("");
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.treeId === treeId);
      const tree = data.trees.find((candidate) => candidate.id === treeId);
      const stockLimit = tree?.stock || 1;

      if (existingItem) {
        return currentItems.map((item) =>
          item.treeId === treeId ? { ...item, quantity: Math.min(item.quantity + 1, stockLimit) } : item
        );
      }

      return [...currentItems, { treeId, quantity: 1 }];
    });
  }

  function updateQuantity(treeId, quantity) {
    const tree = data.trees.find((candidate) => candidate.id === treeId);
    const stockLimit = tree?.stock || 1;
    const normalizedQuantity = Math.min(Math.max(Number(quantity) || 1, 1), stockLimit);

    setCartItems((currentItems) =>
      currentItems.map((item) => (item.treeId === treeId ? { ...item, quantity: normalizedQuantity } : item))
    );
  }

  function removeFromCart(treeId) {
    setCartItems((currentItems) => currentItems.filter((item) => item.treeId !== treeId));
  }

  async function checkout() {
    setMessage("");
    setSubmitting(true);

    try {
      const response = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({ items: cartItems, paymentStatus })
      });

      if (response.payment?.status === "APPROVED") {
        setCartItems([]);
        setMessage("Compra aprobada. Tus arboles ya aparecen en Mis arboles con QR y seguimiento inicial.");
      } else {
        setMessage(response.message || "El pago mock quedo pendiente o rechazado. No se crearon compras.");
      }

      reload();
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Catalogo</p>
        <h2 className="text-3xl font-bold text-forest">Comprar arbol</h2>
      </div>
      {message ? <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-forest">{message}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p>Cargando catalogo...</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-5 md:grid-cols-2">
          {data.trees.map((tree) => (
            <article className="card overflow-hidden" key={tree.id}>
              <img className="h-48 w-full object-cover" src={tree.imageUrl} alt={tree.species} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-forest">{tree.name}</h3>
                    <p className="text-sm font-semibold text-moss">{tree.species}</p>
                  </div>
                  <p className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-leaf">
                    ${Number(tree.price).toLocaleString("es-CO")}
                  </p>
                </div>
                <p className="mt-3 text-sm text-stone-600">{tree.description}</p>
                <dl className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-forest">Ubicacion estimada</dt>
                    <dd>{tree.estimatedLocation}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-forest">CO2 estimado</dt>
                    <dd>{tree.estimatedCo2} kg por ano</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-forest">Stock</dt>
                    <dd>{tree.stock} disponibles</dd>
                  </div>
                </dl>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="btn-secondary" onClick={() => setSelectedTree(tree)} type="button">
                    Detalle
                  </button>
                  <button className="btn-primary" onClick={() => addToCart(tree.id)} disabled={tree.stock <= 0} type="button">
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="card h-fit p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-moss">Carrito</p>
              <h3 className="text-2xl font-bold text-forest">{cartCount} arboles</h3>
            </div>
            <p className="text-lg font-bold text-leaf">${cartTotal.toLocaleString("es-CO")}</p>
          </div>

          <div className="mt-5 grid gap-4">
            {cartDetails.length === 0 ? <p className="text-sm text-stone-500">Agrega arboles del catalogo para iniciar la compra.</p> : null}
            {cartDetails.map((item) => (
              <div className="rounded-lg border border-stone-200 p-3" key={item.treeId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-forest">{item.tree.species}</p>
                    <p className="text-sm text-stone-500">${Number(item.tree.price).toLocaleString("es-CO")}</p>
                  </div>
                  <button className="text-sm font-semibold text-red-700" onClick={() => removeFromCart(item.treeId)} type="button">
                    Quitar
                  </button>
                </div>
                <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-stone-500" htmlFor={`quantity-${item.treeId}`}>
                  Cantidad
                </label>
                <input
                  className="field mt-1"
                  id={`quantity-${item.treeId}`}
                  max={item.tree.stock}
                  min="1"
                  onChange={(event) => updateQuantity(item.treeId, event.target.value)}
                  type="number"
                  value={item.quantity}
                />
              </div>
            ))}
          </div>

          <label className="mt-5 block text-sm font-semibold text-forest" htmlFor="paymentStatus">
            Estado mock del pago
          </label>
          <select className="field mt-2" id="paymentStatus" onChange={(event) => setPaymentStatus(event.target.value)} value={paymentStatus}>
            {mockPaymentStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button className="btn-primary mt-5 w-full" disabled={cartItems.length === 0 || submitting} onClick={checkout} type="button">
            {submitting ? "Procesando..." : "Pagar carrito"}
          </button>
        </aside>
      </div>

      {selectedTree ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 px-4 py-6" role="dialog" aria-modal="true">
          <article className="card max-h-full w-full max-w-2xl overflow-auto">
            <img className="h-64 w-full object-cover" src={selectedTree.imageUrl} alt={selectedTree.species} />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-moss">{selectedTree.species}</p>
                  <h3 className="text-3xl font-bold text-forest">{selectedTree.name}</h3>
                </div>
                <p className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-leaf">
                  ${Number(selectedTree.price).toLocaleString("es-CO")}
                </p>
              </div>
              <p className="mt-4 text-stone-600">{selectedTree.description}</p>
              <dl className="mt-5 grid gap-4 text-sm text-stone-600 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-forest">Ubicacion</dt>
                  <dd>{selectedTree.estimatedLocation}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-forest">CO2 estimado</dt>
                  <dd>{selectedTree.estimatedCo2} kg por ano</dd>
                </div>
                <div>
                  <dt className="font-semibold text-forest">Stock</dt>
                  <dd>{selectedTree.stock} disponibles</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button className="btn-secondary" onClick={() => setSelectedTree(null)} type="button">
                  Cerrar
                </button>
                <button className="btn-primary" onClick={() => addToCart(selectedTree.id)} disabled={selectedTree.stock <= 0} type="button">
                  Agregar al carrito
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
