import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-moss">Cuenta</p>
        <h2 className="text-3xl font-bold text-forest">Perfil</h2>
      </div>
      <div className="card max-w-xl p-6">
        <dl className="grid gap-4">
          <div>
            <dt className="text-sm font-semibold text-stone-500">Nombre</dt>
            <dd className="mt-1 text-lg font-bold text-forest">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-stone-500">Email</dt>
            <dd className="mt-1 text-lg text-stone-700">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-stone-500">Rol</dt>
            <dd className="mt-1 text-lg text-stone-700">{user.role}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
