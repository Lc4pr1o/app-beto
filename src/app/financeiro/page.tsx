export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { nowBR } from "@/lib/date";
import { NewChargeModal } from "@/components/new-charge-modal";
import { PaymentRowActions } from "@/components/payment-row-actions";

export default async function FinanceiroPage() {
  const today = nowBR();
  const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const endOfMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  const [payments, monthStats, clients] = await Promise.all([
    prisma.payment.findMany({
      include: { client: true, appointment: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
  ]);

  const paid = monthStats.find((s) => s.status === "PAID");
  const pendingGroups = monthStats.filter((s) => s.status === "PENDING" || s.status === "SENT");
  const totalPaid = paid?._sum.amount ?? 0;
  const totalPending = pendingGroups.reduce((sum, s) => sum + (s._sum.amount ?? 0), 0);
  const pendingCount = pendingGroups.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financeiro</h2>
          <p className="text-gray-500 text-sm capitalize">
            {format(today, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <NewChargeModal clients={clients} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-xs text-gray-500">Recebido no mês</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            R$ {totalPaid.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-400">{paid?._count ?? 0} pagamentos</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-xs text-gray-500">A receber</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            R$ {totalPending.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-400">{pendingCount} pendentes</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-violet-600" />
            <span className="text-xs text-gray-500">Total previsto</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            R$ {(totalPaid + totalPending).toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-400">recebido + pendente</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign size={16} className="text-gray-400" />
            Todos os pagamentos
          </h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhum pagamento registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {p.client?.name ?? <span className="text-gray-400 italic">Cliente excluído</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(p.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                    {p.appointment && (
                      <> · {format(p.appointment.startTime, "HH:mm")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    R$ {p.amount.toFixed(2).replace(".", ",")}
                  </span>
                  <PaymentStatusBadge status={p.status} />
                  <PaymentRowActions paymentId={p.id} status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
    SENT: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
    PAID: { label: "Pago", className: "bg-green-100 text-green-700" },
    OVERDUE: { label: "Vencido", className: "bg-red-100 text-red-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>;
}
