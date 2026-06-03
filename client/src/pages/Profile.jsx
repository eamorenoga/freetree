import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, username: user.username || "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await updateProfile(form);
      setMessage("Perfil actualizado correctamente.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Cuenta</p>
        <h2 className="text-3xl font-bold text-forest">Perfil</h2>
      </div>
      <form className="card grid max-w-xl gap-4 p-6" onSubmit={handleSubmit}>
        {message ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-forest">{message}</p> : null}
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="text-sm font-semibold text-stone-700">Nombre</label>
        <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <label className="text-sm font-semibold text-stone-700">Usuario</label>
        <input className="field" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        <div>
          <p className="text-sm font-semibold text-stone-500">Email</p>
          <p className="mt-1 text-stone-700">{user.email}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-500">Rol</p>
          <p className="mt-1 text-stone-700">{user.role}</p>
        </div>
        <button className="btn-primary w-fit" type="submit">Guardar perfil</button>
      </form>
    </section>
  );
}
