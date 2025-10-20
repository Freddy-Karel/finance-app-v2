import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ requireRole: vi.fn(() => Promise.resolve()) }));

const mockAnomalies = [
  { id: "a1", createdAt: new Date("2025-01-01T00:00:00.000Z"), resolvedAt: null, level: "warning", code: "W1", details: "d1", transactionId: null, tx: null },
  { id: "a2", createdAt: new Date("2025-01-02T00:00:00.000Z"), resolvedAt: new Date("2025-01-03T00:00:00.000Z"), level: "critical", code: "C1", details: "d2", transactionId: "t1", tx: { id: "t1", kind: "OUT", label: "L", at: new Date("2025-01-02T00:00:00.000Z") } },
];

const mockPrisma = {
  anomaly: {
    findMany: vi.fn(async () => mockAnomalies),
    count: vi.fn(async () => mockAnomalies.length),
    update: vi.fn(async ({ where }: any) => ({ id: where.id, resolvedAt: new Date() })),
  },
  auditLog: { create: vi.fn(async () => ({ id: "log1" })) },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("anomalies actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listAnomalies returns items and total", async () => {
    const { listAnomalies } = await import("@/server/actions/anomalies");
    const res = await listAnomalies({});
    expect(res.total).toBe(2);
    expect(Array.isArray(res.items)).toBeTruthy();
    expect(res.items[0].id).toBe("a1");
  });

  it("resolveAnomaly updates anomaly and creates audit log when note provided", async () => {
    const { resolveAnomaly } = await import("@/server/actions/anomalies");
    const res = await resolveAnomaly({ id: "a1", note: "fixed" });
    expect(res.id).toBe("a1");
    expect(mockPrisma.anomaly.update).toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Object) }));
  });

  it("exportAnomaliesCSV returns CSV string", async () => {
    const { exportAnomaliesCSV } = await import("@/server/actions/anomalies");
    const csv = await exportAnomaliesCSV({});
    expect(typeof csv).toBe("string");
    expect(csv.split("\n")[0]).toContain("id,createdAt,resolvedAt");
  });
});
