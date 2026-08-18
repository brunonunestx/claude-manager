import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-neutral-400">Sessões do Claude rodando localmente, em tempo real.</p>
      </div>
      <Dashboard />
    </div>
  );
}
