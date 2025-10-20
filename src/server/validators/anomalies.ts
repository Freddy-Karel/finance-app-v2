import { z } from "zod";
export const ListAnomaliesSchema = z.object({ start:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), end:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), level:z.array(z.enum(["critical","warning"])).optional(), code:z.string().min(2).optional(), status:z.enum(["open","resolved"]).optional(), limit:z.number().int().min(1).max(200).default(50), offset:z.number().int().min(0).default(0) });
export const ResolveAnomalySchema = z.object({ id:z.string().min(1), note:z.string().max(500).optional() });
