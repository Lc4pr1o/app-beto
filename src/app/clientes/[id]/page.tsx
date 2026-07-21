export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, Calendar, DollarSign, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditClientForm } from "@/components/edit-client-form";
import { PaymentButton } from "@/components/payment-button";
import { DeleteClientButton } from "@/components/delete-client-button";
import { PaymentRowActions } from "@/components/payment-row-actions";
import { SendWhatsappModal } from "@/components/send-whatsapp-modal";
import { ClientTags } from "@/components/client-tags";
import { formatTimeBR, formatDateBR } from "@/lib/date";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [client, stats] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        appointments: { orderBy: { startTime: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        planSubscriptions: { include: { plan: true }, orderBy: { purchasedAt: "desc" } },
        whatsappLogs: { orderBy: { sentAt: "desc" }, take: 10 },
      },
    }),
    Promise.all([
      prisma.payment.aggregate({
        where: { clientId: id, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.appointment.count({ where: { clientId: id, status: "DONE" } }),
      prisma.appointment.count({ where: { clientId: id, status: "CANCELLED" } }),
    ]),
  ]);

  if (!client) notFound();

  const [lifetimeAgg, sessoesDone, sessoesCanceladas] = stats;
  const lifetimeValue = lifetimeAgg._sum.amount ?? 0;

  const pendingPayments = client.payments.filter((p) => p.status === "PENDING");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/clientes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
          {client.phone !== "00000000000" && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
              <Phone size={12} />
              {client.phone}
            </p>
          )}
          <div className="mt-2">
            <ClientTags clientId={client.id} initialTags={(client as any).tags ?? []} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SendWhatsappModal clientId={client.id} clientName={client.name} />
          <EditClientForm client={client} />
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-green-600">
            R$ {lifetimeValue.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Total gasto</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-violet-600">{sessoesDone}</p>
          <p className="text-xs text-gray-400 mt-0.5">Sessões realizadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-gray-500">{sessoesCanceladas}</p>
          <p className="text-xs text-gray-400 mt-0.5">Cancelamentos</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Histórico de atendimentos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-violet-600" />
            Atendimentos
          </h3>
          {client.appointments.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum atendimento ainda.</p>
          ) : (
            <ul className="space-y-2">
              {client.appointments.slice(0, 8).map((appt) => (
                <li key={appt.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-700">
                      {formatDateBR(appt.startTime)} às {formatTimeBR(appt.startTime)}
                    </span>
                    <p className="text-xs text-gray-400">{appt.serviceType}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagamentos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-amber-500" />
            Pagamentos
          </h3>
          {client.payments.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum pagamento ainda.</p>
          ) : (
            <ul className="space-y-2">
              {client.payments.slice(0, 8).map((p) => (
                <li key={p.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-700">
                      R$ {p.amount.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-gray-400 text-xs ml-2">
                      {format(p.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={p.status} />
                    <PaymentRowActions paymentId={p.id} status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {pendingPayments.length > 0 && pendingPayments[0].appointmentId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <PaymentButton
                appointmentId={pendingPayments[0].appointmentId}
                amount={pendingPayments[0].amount}
                clientName={client.name}
              />
            </div>
          )}
        </div>

        {/* Mensagens enviadas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-green-600" />
            Mensagens WhatsApp
          </h3>
          {client.whatsappLogs.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma mensagem enviada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {client.whatsappLogs.map((log) => (
                <li key={log.id} className="text-sm border-l-2 border-green-200 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageTypeBadge type={log.type} />
                    <span className="text-gray-400 text-xs">
                      {format(log.sentAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs whitespace-pre-line">{log.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>;
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

function MessageTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    CONFIRMATION: { label: "Confirmação", className: "bg-blue-100 text-blue-700" },
    PAYMENT_LINK: { label: "Pagamento", className: "bg-amber-100 text-amber-700" },
    REENGAGEMENT: { label: "Reengajamento", className: "bg-purple-100 text-purple-700" },
  };
  const s = map[type] ?? { label: type, className: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>;
}
