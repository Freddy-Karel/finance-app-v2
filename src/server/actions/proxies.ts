"use server";
// Small re-exporting server actions to be imported into Client Components.
// Next requires server actions to be exported from a separate module (not defined inline in client files).

export async function createIncomeS(input:any){ const { createIncome } = await import("./transactions"); return createIncome(input); }
export async function createExpenseS(input:any){ const { createExpense } = await import("./transactions"); return createExpense(input); }
export async function createTransferS(input:any){ const { createTransfer } = await import("./transactions"); return createTransfer(input); }

export async function listAnomaliesS(p:any){ const { listAnomalies } = await import("./anomalies"); return listAnomalies(p); }
export async function resolveAnomalyS(i:any){ const { resolveAnomaly } = await import("./anomalies"); return resolveAnomaly(i); }
export async function exportAnomaliesCSVS(p:any){ const { exportAnomaliesCSV } = await import("./anomalies"); return exportAnomaliesCSV(p); }
export async function getAnomaliesCountS(input?:any){ const { getAnomaliesCount } = await import('./anomalies'); return getAnomaliesCount(input); }

export async function getDaySummaryS(date:string){ const { getDaySummary } = await import("./distribution"); return getDaySummary({ date }); }
export async function getDistributionProposalS(date:string){ const { getDistributionProposal } = await import("./queries"); return getDistributionProposal({ date }); }
export async function distributeS(payload:any){ const { distribute } = await import("./distribution"); return distribute(payload); }
export async function reconcileS(payload:{declaredOnHand:number}){ const { reconcile } = await import("./distribution"); return reconcile(payload); }

export async function listServicesS(){ const { listServices } = await import("./settings"); return listServices(); }
export async function upsertServiceS(input:any){ const { upsertService } = await import("./settings"); return upsertService(input); }
export async function toggleServiceS(input:any){ const { toggleService } = await import("./settings"); return toggleService(input); }
export async function deleteServiceS(input:any){ const { deleteService } = await import('./settings'); return deleteService(input); }
export async function listEnvelopesS(){ const { listEnvelopes } = await import("./settings"); return listEnvelopes(); }
export async function upsertEnvelopeS(input:any){ const { upsertEnvelope } = await import("./settings"); return upsertEnvelope(input); }
export async function toggleEnvelopeActiveS(input:any){ const { toggleEnvelopeActive } = await import("./settings"); return toggleEnvelopeActive(input); }
export async function toggleEnvelopeProtectedS(input:any){ const { toggleEnvelopeProtected } = await import("./settings"); return toggleEnvelopeProtected(input); }
export async function deleteEnvelopeS(input:any){ const { deleteEnvelope } = await import("./settings"); return deleteEnvelope(input); }
export async function forceDeleteEnvelopeS(input:any){ const { forceDeleteEnvelope } = await import("./settings"); return forceDeleteEnvelope(input); }
export async function logEnvelopeRestoreS(input:any){ const { logEnvelopeRestore } = await import("./settings"); return logEnvelopeRestore(input); }
export async function getEnvelopeBalancesS(){ const { getEnvelopeBalances } = await import("./queries"); return getEnvelopeBalances(); }
export async function getBlockedEnvelopeCoverageS(){ const { getBlockedEnvelopeCoverage } = await import('../queries/envelopes'); return getBlockedEnvelopeCoverage(); }
export async function getEnvelopeCoverageAllS(input?:any){ const { getEnvelopeCoverageAll } = await import('../queries/envelopes'); return getEnvelopeCoverageAll(input); }

export async function getActiveRuleS(){ const { getActiveRule } = await import("./settings"); return getActiveRule(); }
export async function updateDistributionRuleS(items:any){ const { updateDistributionRule } = await import("./settings"); return updateDistributionRule(items); }
// ChargeType APIs removed after refactor
export async function listRecurringChargesS(){ const { listRecurringCharges } = await import('./settings'); return listRecurringCharges(); }
export async function upsertRecurringChargeS(input:any){ const { upsertRecurringCharge } = await import('./settings'); return upsertRecurringCharge(input); }
export async function deleteRecurringChargeS(input:any){ const { deleteRecurringCharge } = await import('./settings'); return deleteRecurringCharge(input); }
// createAnomalyWithAuditS removed (Slack notifications removed). Use createLowCoverageAnomaliesS for bulk anomaly creation.
export async function getTransactionsReportS(input:any){ const { getTransactionsReport } = await import('./reports'); return getTransactionsReport(input); }
export async function getEnvelopeExecutionReportS(input:any){ const { getEnvelopeExecutionReport } = await import('./reports'); return getEnvelopeExecutionReport(input); }

export async function envelopeAggregatesS(input:any){ const { getEnvelopesWithStats } = await import('./envelopes'); return getEnvelopesWithStats(input); }
export async function envelopeStatsS(input?:any){ const { getEnvelopesWithStats } = await import('./envelopes'); return getEnvelopesWithStats(input); }
export async function computeReferenceS(input:any){ const { computeReference } = await import("./reference"); return computeReference(input); }
export async function adoptSuggestedRuleS(input:any){ const { adoptSuggestedRule } = await import("./reference"); return adoptSuggestedRule(input); }
export async function createExpenseFormS(formData: FormData){ const { createExpenseForm } = await import("./transactions"); return createExpenseForm(formData); }
export async function recommendPercentagesS(input:any){ const { recommendPercentages } = await import('./settings'); return recommendPercentages(input); }
export async function setOnboardingRevenueS(input:any){ const { setOnboardingRevenue } = await import('./settings'); return setOnboardingRevenue(input); }
export async function getOnboardingRevenueS(){ const { getOnboardingRevenue } = await import('./settings'); return getOnboardingRevenue(); }
export async function proposePercentAdjustmentsS(input:any){ const { proposePercentAdjustments } = await import('./settings'); return proposePercentAdjustments(input); }
export async function applySuggestedPercentsS(input:any){ const { applySuggestedPercents } = await import('./settings'); return applySuggestedPercents(input); }
export async function createLowCoverageAnomaliesS(input?:any){ const { createLowCoverageAnomalies } = await import('./settings'); return createLowCoverageAnomalies(input); }
