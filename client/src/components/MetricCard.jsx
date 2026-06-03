export default function MetricCard({ label, value, detail }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-forest">{value}</p>
      {detail ? <p className="mt-2 text-sm text-stone-500">{detail}</p> : null}
    </div>
  );
}
