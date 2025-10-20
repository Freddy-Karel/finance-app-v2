import { getEnvelopeBalances } from "@/server/actions/queries";
import { getEnvelopeCoverageAll } from "@/server/queries/envelopes";
import LowCoverageWrapper from '@/components/LowCoverageWrapper';
import { formatAmount } from "@/lib/utils";

export const revalidate = 60;

export default async function DashboardPage() {
  const balances = await getEnvelopeBalances();
  const coverage = await getEnvelopeCoverageAll({ daysWindow: 90 });
  // compute displayed amount: prefer budgetTarget, otherwise inflow-outflow
  const total = balances.reduce((s: number, b: any) => {
    const amount = (typeof b.budgetTarget === 'number' ? b.budgetTarget : ((b.inflow ?? 0) - (b.outflow ?? 0)));
    return s + Number(amount || 0);
  }, 0);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="text-sm text-muted">Vue d'ensemble de vos finances</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-card p-6 shadow-lg flex flex-col justify-center">
          <div className="text-sm text-muted">Solde total</div>
          <div className="text-4xl font-bold mt-2">{formatAmount(total)}</div>
        </div>

        <div className="md:col-span-2 rounded-2xl bg-card p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Enveloppes</h3>
          <div className="mb-4">
            <h4 className="text-sm font-medium">Couverture des charges bloquées</h4>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {coverage.map((c:any)=> {
                const low = c.monthsCoverage !== Infinity && c.monthsCoverage < 2;
                return (
                <div key={c.envelopeId} className="rounded-xl bg-surface p-3 flex items-center justify-between" title={`Calculé sur 90 jours — solde ${c.balance} € — consommation ${c.avgMonthly} €/mois`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50">{c.emoji ?? '📁'}</div>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-white/70">{c.avgMonthly} €/mois</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold flex items-center gap-3">
                    <div>{c.monthsCoverage === Infinity ? '∞' : `${c.monthsCoverage} mois`}</div>
                    {low && (
                      <a href="/settings/onboarding" className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded" title="Couverture faible — ouvrir l'onboarding pour recommandations">Réajuster</a>
                    )}
                  </div>
                </div>
              )})}
            </div>
          </div>
          <div className="mt-4">
            <LowCoverageWrapper />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {balances.map((b: any) => {
              const emoji = b.emoji ?? '👜';
              const budget = typeof b.budgetTarget === 'number' ? b.budgetTarget : (b.inflow ?? null);
              const spent = (b as any).outflow ?? 0;
              const remaining = budget !== null ? Math.max(0, budget - spent) : null;
              const denom = budget ?? Math.max(b.inflow ?? 0, 1);
              const pctSpent = denom ? Math.min(100, Math.round((spent / denom) * 100)) : 0;
              const pctRemaining = denom ? Math.max(0, 100 - pctSpent) : 100;
              return (
                <div key={b.envelopeId} className="rounded-2xl bg-surface p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-xl">{emoji}</div>
                      <div>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-white/70">{formatAmount((b.inflow ?? 0) - (b.outflow ?? 0))} balance</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{budget !== null ? formatAmount(budget) : '—'}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <div>{formatAmount(spent)} dépensés</div>
                      <div>{remaining !== null ? formatAmount(remaining) : '—'} restants</div>
                    </div>
                    <div className="mt-2 w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div className="h-3 bg-amber-400" style={{ width: `${pctRemaining}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
