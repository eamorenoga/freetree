import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await register(form.name, form.username, form.email, form.password);
      navigate("/app");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-4">
      <form className="card w-full max-w-md p-8" onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">TerraBioCol</p>
        <h1 className="mt-2 text-3xl font-bold text-forest">Crear cuenta</h1>
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="mt-6 block text-sm font-semibold text-stone-700">Nombre</label>
        <input className="field mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold text-stone-700">Usuario</label>
        <input className="field mt-2" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold text-stone-700">Email</label>
        <input className="field mt-2" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold text-stone-700">Contrasena</label>
        <input
          className="field mt-2"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button className="btn-primary mt-6 w-full" type="submit">
          Registrarme
        </button>
        <p className="mt-4 text-center text-sm text-stone-500">
          Ya tienes cuenta? <Link className="font-semibold text-leaf" to="/login">Inicia sesion</Link>
        </p>
      </form>
    </main>
  );
}
