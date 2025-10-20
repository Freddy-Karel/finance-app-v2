import ExpensesClient from "./ExpensesClient";
import { createExpenseFormS } from "@/server/actions/proxies";

// Server wrapper page: uses the server action as the form action so the function is
// invoked server-side (no function placed into the DOM). The client component
// `ExpensesClient` prepares a hidden `payload` input with JSON before submit.
export default function ExpensesPage(){
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Dépenses (fractionnées)</h2>

      {/* Server-rendered form uses the server action reference exported in proxies */}
      <form action={createExpenseFormS} className="rounded-2xl bg-card p-4 shadow-card space-y-4" data-testid="expense-allocations">
        <ExpensesClient />
      </form>
    </section>
  );
}
