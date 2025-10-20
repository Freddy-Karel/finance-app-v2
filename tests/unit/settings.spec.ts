import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ requireRole: vi.fn(() => Promise.resolve()) }));

const mockPrisma = {
  envelope: {
    findMany: vi.fn(async () => [{ id: 'e1', name: 'E1', protected: false, active: true, budgetTarget: 1000 }]),
    findFirst: vi.fn(async ()=> null),
    update: vi.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    create: vi.fn(async ({ data }) => ({ id: 'new', ...data }))
  },
  recurringCharge: {
    findMany: vi.fn(async () => []),
    create: vi.fn(async ({ data }) => ({ id: 'rc1', ...data }))
  },
  auditLog: { create: vi.fn(async ()=> ({ id: 'log1' })) }
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

describe('settings actions', ()=>{
  beforeEach(()=>{ vi.clearAllMocks(); });

  it('ensureImprevusEnvelope creates imprevus if missing via recommendPercentages call', async ()=>{
    const { recommendPercentages } = await import('@/server/actions/settings');
    const res = await recommendPercentages({ amount: 5000 });
    expect(Array.isArray(res)).toBe(true);
    expect(mockPrisma.envelope.create).toHaveBeenCalled();
  });

  it('upsertRecurringCharge works', async ()=>{
    const { upsertRecurringCharge } = await import('@/server/actions/settings');
    const r = await upsertRecurringCharge({ name:'Rent', amount:1000, frequency:'monthly', envelopeId: null });
    expect(r).toHaveProperty('id');
  });
});


