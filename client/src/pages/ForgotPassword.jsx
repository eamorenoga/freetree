import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setResult(null);
    setError("");

    try {
      setResult(await forgotPassword(identifier));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-4">
      <form className="card w-full max-w-md p-8" onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">TerraBioCol</p>
        <h1 className="mt-2 text-3xl font-bold text-forest">Recuperar contrasena</h1>
        <p className="mt-2 text-sm text-stone-500">Te mostraremos un token simulado para desarrollo.</p>
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {result ? (
          <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-forest">
            <p>{result.message}</p>
            {result.resetToken ? <p className="mt-2 break-all font-mono text-xs">Token: {result.resetToken}</p> : null}
            {result.resetToken ? <Link className="mt-3 inline-block font-semibold text-leaf" to={`/reset-password?token=${result.resetToken}`}>Restablecer ahora</Link> : null}
          </div>
        ) : null}
        <label className="mt-6 block text-sm font-semibold text-stone-700">Usuario o correo</label>
        <input className="field mt-2" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        <button className="btn-primary mt-6 w-full" type="submit">Generar recuperacion</button>
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link className="font-semibold text-leaf" to="/login">Volver al login</Link>
        </p>
      </form>
    </main>
  );
}
