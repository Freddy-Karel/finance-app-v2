"use server";
import { requireRole } from "@/lib/auth";
import { TransactionsReportSchema, EnvelopeExecutionReportSchema } from "@/server/validators/reports";
import { fetchTransactionsReport, fetchEnvelopeExecution, toCSV } from "@/server/queries/reports";
import type { TransactionRow, EnvelopeExecutionRow, Allocation } from "@/server/types";

export async function getTransactionsReport(input: { start: string; end: string; type?: "IN" | "OUT" | "DIST"; envelopeId?: string; serviceId?: string }): Promise<TransactionRow[]> {
  await requireRole(["auditor", "manager", "operator"]);
  const p = TransactionsReportSchema.safeParse({ ...input, limit: 200, offset: 0 });
  if (!p.success) throw new Error(p.error.errors.map(e => e.message).join("; "));
  return fetchTransactionsReport(p.data) as Promise<TransactionRow[]>;
}

export async function getEnvelopeExecutionReport(input: { start: string; end: string }): Promise<EnvelopeExecutionRow[]> {
  await requireRole(["auditor", "manager", "operator"]);
  const p = EnvelopeExecutionReportSchema.safeParse(input);
  if (!p.success) throw new Error(p.error.errors.map(e => e.message).join("; "));
  return fetchEnvelopeExecution(p.data) as Promise<EnvelopeExecutionRow[]>;
}

export async function exportTransactionsCSV(input: { start: string; end: string; type?: "IN" | "OUT" | "DIST"; envelopeId?: string; serviceId?: string }) {
  const rows = await getTransactionsReport(input) as TransactionRow[];
  return toCSV(rows.map((r: TransactionRow) => ({
    id: r.id,
    kind: r.kind,
    label: r.label,
    amount: r.amount,
    at: new Date(r.at).toISOString(),
    serviceId: r.serviceId ?? "",
    allocations: r.allocations.map((a: Allocation) => `${a.envelopeName}:${a.amount}`).join("|")
  })));
}

export async function exportEnvelopeExecutionCSV(input: { start: string; end: string }) {
  const rows = await getEnvelopeExecutionReport(input) as EnvelopeExecutionRow[];
  return toCSV(rows.map((r: EnvelopeExecutionRow) => ({
    envelopeId: r.envelopeId,
    name: r.name,
    inflow: r.inflow,
    outflow: r.outflow,
    delta: r.delta
  })));
}
