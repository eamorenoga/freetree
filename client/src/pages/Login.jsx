import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "cliente", password: "Terrabio123!" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form.identifier, form.password);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-4">
      <form className="card w-full max-w-md p-8" onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">TerraBioCol</p>
        <h1 className="mt-2 text-3xl font-bold text-forest">Iniciar sesion</h1>
        <p className="mt-2 text-sm text-stone-500">Gestiona tus arboles, compras y compensacion ambiental.</p>
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="mt-6 block text-sm font-semibold text-stone-700">Usuario o correo</label>
        <input className="field mt-2" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold text-stone-700">Contrasena</label>
        <input
          className="field mt-2"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button className="btn-primary mt-6 w-full" type="submit">
          Entrar
        </button>
        <p className="mt-4 text-center text-sm text-stone-500">
          No tienes cuenta? <Link className="font-semibold text-leaf" to="/register">Registrate</Link>
        </p>
        <p className="mt-2 text-center text-sm text-stone-500">
          Olvidaste tu contrasena? <Link className="font-semibold text-leaf" to="/forgot-password">Recuperala</Link>
        </p>
      </form>
    </main>
  );
}
