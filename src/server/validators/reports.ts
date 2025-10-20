import { z } from "zod";
export const DateRange = z.object({ start:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end:z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export const TransactionsReportSchema = DateRange.extend({ type:z.enum(["IN","OUT","DIST"]).optional(), envelopeId:z.string().optional(), serviceId:z.string().optional(), limit:z.number().int().min(1).max(500).default(200), offset:z.number().int().min(0).default(0) });
export const EnvelopeExecutionReportSchema = DateRange;
