export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, DollarSign, Users, Clock, AlertCircle } from "lucide-react";
import { SyncButton } from "@/components/sync-button";
import { PaymentButton } from "@/components/payment-button";
import { startOfTodayBR, endOfTodayBR, formatLongDateBR, formatTimeBR } from "@/lib/date";

async function getDashboardData() {
  const today = startOfTodayBR();
  const todayEnd = endOfTodayBR();

  const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const endOfMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  const [todayAppointments, pendingPayments, monthRevenue, totalClients] = await Promise.all([
    prisma.appointment.findMany({
      where: { startTime: { gte: today, lte: todayEnd }, status: { not: "CANCELLED" } },
      include: { client: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PENDING", "SENT"] } },
      include: { client: true, appointment: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.client.count(),
  ]);

  return {
    todayAppointments,
    pendingPayments,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    totalClients,
  };
}

export default async function DashboardPage() {
  const { todayAppointments, pendingPayments, monthRevenue, totalClients } =
    await getDashboardData();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm capitalize">{formatLongDateBR()}</p>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Calendar className="text-violet-600" size={20} />}
          label="Hoje"
          value={String(todayAppointments.length)}
          sub="atendimentos"
        />
        <StatCard
          icon={<DollarSign className="text-green-600" size={20} />}
          label="Receita do mês"
          value={`R$ ${monthRevenue.toFixed(2).replace(".", ",")}`}
          sub="recebido"
        />
        <StatCard
          icon={<AlertCircle className="text-amber-600" size={20} />}
          label="Pagamentos"
          value={String(pendingPayments.length)}
          sub="pendentes"
        />
        <StatCard
          icon={<Users className="text-blue-600" size={20} />}
          label="Clientes"
          value={String(totalClients)}
          sub="cadastrados"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-violet-600" />
            Agenda de hoje
          </h3>
          {todayAppointments.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum atendimento hoje.</p>
          ) : (
            <ul className="space-y-3">
              {todayAppointments.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {appt.client?.name ?? appt.title}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatTimeBR(appt.startTime)} – {formatTimeBR(appt.endTime)}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-amber-500" />
            Pagamentos pendentes
          </h3>
          {pendingPayments.length === 0 ? (
            <p className="text-gray-400 text-sm">Tudo em dia! 🎉</p>
          ) : (
            <ul className="space-y-3">
              {pendingPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.client.name}</p>
                    <p className="text-gray-400 text-xs">
                      R$ {p.amount.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  {p.appointmentId && p.status === "PENDING" && (
                    <PaymentButton
                      appointmentId={p.appointmentId}
                      amount={p.amount}
                      clientName={p.client.name}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: "Agendado", className: "bg-blue-100 text-blue-700" },
    CONFIRMED: { label: "Confirmado", className: "bg-green-100 text-green-700" },
    DONE: { label: "Concluído", className: "bg-gray-100 text-gray-600" },
    CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}
