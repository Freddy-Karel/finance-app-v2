export type Allocation = { envelopeId: string; envelopeName: string; amount: number };
export type TransactionRow = { id: string; kind: "IN" | "OUT" | "DIST"; label: string | null; amount: number; at: string | Date; serviceId: string | null; allocations: Allocation[] };
export type EnvelopeExecutionRow = { envelopeId: string; name: string; protected: boolean; active: boolean; inflow: number; outflow: number; delta: number };

export type AnomalyRowFromDb = {
  id: string;
  createdAt: Date;
  resolvedAt: Date | null;
  level: string;
  code: string;
  details: string;
  transactionId?: string | null;
  tx?: { id: string; kind: string; label: string; at: Date } | null;
};

export type AnomalyListItem = {
  id: string;
  createdAt: Date;
  resolvedAt: Date | null;
  level: string;
  code: string;
  details: string;
  transactionId: string | null;
  txKind: string | null;
  txLabel: string | null;
  txAt: Date | null;
  status: "open" | "resolved";
};
