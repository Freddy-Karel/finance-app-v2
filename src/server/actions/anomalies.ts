"use server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ListAnomaliesSchema, ResolveAnomalySchema } from "@/server/validators/anomalies";
import { toCSV } from "@/server/queries/reports";
import type { AnomalyRowFromDb, AnomalyListItem } from "@/server/types";

function range(start?: string, end?: string) {
  if (!start || !end) return undefined;
  return { gte: new Date(start + "T00:00:00.000Z"), lte: new Date(end + "T23:59:59.999Z") };
}

export async function listAnomalies(input: unknown) {
  await requireRole(["operator", "manager", "auditor"]);
  const p = ListAnomaliesSchema.safeParse(input);
  if (!p.success) throw new Error(p.error.errors.map(e => e.message).join("; "));
  const { start, end, level, code, status, limit, offset } = p.data;
  const where: any = {};
  const r = range(start, end);
  if (r) where.createdAt = r;
  if (level?.length) where.level = { in: level };
  if (code) where.code = { contains: code, mode: "insensitive" };
  if (status === "open") where.resolvedAt = null;
  if (status === "resolved") where.resolvedAt = { not: null };

  const rows = await prisma.anomaly.findMany({
    where,
    include: { tx: { select: { id: true, kind: true, label: true, at: true } } },
    orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
    take: limit,
    skip: offset,
  });

  const total = await prisma.anomaly.count({ where });

  const items: AnomalyListItem[] = (rows as AnomalyRowFromDb[]).map((a: AnomalyRowFromDb) => ({
    id: a.id,
    createdAt: a.createdAt,
    resolvedAt: a.resolvedAt ?? null,
    level: a.level,
    code: a.code,
    details: a.details,
    transactionId: a.transactionId ?? null,
    txKind: a.tx?.kind ?? null,
    txLabel: a.tx?.label ?? null,
    txAt: a.tx?.at ?? null,
    status: a.resolvedAt ? "resolved" : "open",
  }));

  return { total, items };
}

export async function getAnomaliesCount(input?: { status?: 'open'|'resolved' }){
  await requireRole(["operator","manager","auditor"]);
  const where:any = {};
  if(input?.status === 'open') where.resolvedAt = null;
  if(input?.status === 'resolved') where.resolvedAt = { not: null };
  const total = await prisma.anomaly.count({ where });
  return { total };
}

export async function resolveAnomaly(input: unknown) {
  await requireRole(["manager"]);
  const p = ResolveAnomalySchema.safeParse(input);
  if (!p.success) throw new Error(p.error.errors.map(e => e.message).join("; "));
  const updated = await prisma.anomaly.update({ where: { id: p.data.id }, data: { resolvedAt: new Date() } });
  // If a note was provided, persist it in the AuditLog for traceability
  if (p.data.note) {
    await prisma.auditLog.create({ data: { action: "anomaly.resolve", metaJson: JSON.stringify({ anomalyId: p.data.id, note: p.data.note }), } });
  }
  return { id: updated.id, resolvedAt: updated.resolvedAt };
}

export async function exportAnomaliesCSV(input: unknown) {
  const { items } = await listAnomalies({ ...((input as any) || {}), limit: 200, offset: 0 });
  const rows = (items as AnomalyListItem[]).map((i: AnomalyListItem) => ({
    id: i.id,
    createdAt: i.createdAt.toISOString(),
    resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : "",
    level: i.level,
    code: i.code,
    details: i.details,
    status: i.status,
    transactionId: i.transactionId ?? "",
    txKind: i.txKind ?? "",
    txLabel: i.txLabel ?? "",
    txAt: i.txAt ? i.txAt.toISOString() : "",
  }));

  return toCSV(rows, ["id", "createdAt", "resolvedAt", "level", "code", "details", "status", "transactionId", "txKind", "txLabel", "txAt"]);
}
