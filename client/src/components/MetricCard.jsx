export default function MetricCard({ label, value, detail }) {
  return (
    <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-forest md:text-4xl">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-stone-500">{detail}</p> : null}
    </div>
  );
}
