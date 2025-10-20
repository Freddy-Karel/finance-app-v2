import { auth } from "@clerk/nextjs/server";
export type Role = "operator" | "manager" | "auditor";
export async function getCurrentRole(): Promise<Role> {
  if (process.env.E2E_ROLE === "operator" || process.env.E2E_ROLE === "manager" || process.env.E2E_ROLE === "auditor") return process.env.E2E_ROLE as Role;
  const { userId, sessionClaims } = auth(); if (!userId) throw new Error("Unauthenticated");
  return (sessionClaims?.role as Role | undefined) ?? "operator";
}
export async function requireRole(allowed: Role[]) { const role = await getCurrentRole(); if (!allowed.includes(role)) throw new Error("Forbidden"); return role; }
