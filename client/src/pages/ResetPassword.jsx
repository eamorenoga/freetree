import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [form, setForm] = useState({ token: tokenFromUrl, password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await resetPassword(form.token, form.password);
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 900);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-4">
      <form className="card w-full max-w-md p-8" onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">TerraBioCol</p>
        <h1 className="mt-2 text-3xl font-bold text-forest">Nueva contrasena</h1>
        {message ? <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-forest">{message}</p> : null}
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="mt-6 block text-sm font-semibold text-stone-700">Token</label>
        <input className="field mt-2" value={form.token} onChange={(event) => setForm({ ...form, token: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold text-stone-700">Nueva contrasena</label>
        <input
          className="field mt-2"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button className="btn-primary mt-6 w-full" type="submit">Actualizar contrasena</button>
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link className="font-semibold text-leaf" to="/login">Volver al login</Link>
        </p>
      </form>
    </main>
  );
}
