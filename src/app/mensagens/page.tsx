export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { MessageSettingsForm } from "@/components/message-settings-form";
import { MessageTriggerButtons } from "@/components/message-trigger-buttons";

export default async function MensagensPage() {
  const [logs, settings] = await Promise.all([
    prisma.whatsappLog.findMany({
      include: { client: true },
      orderBy: { sentAt: "desc" },
      take: 100,
    }),
    getSettings(),
  ]);

  const stats = {
    total: logs.length,
    confirmation: logs.filter((l) => l.type === "CONFIRMATION").length,
    payment: logs.filter((l) => l.type === "PAYMENT_LINK").length,
    reengagement: logs.filter((l) => l.type === "REENGAGEMENT").length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mensagens</h2>
          <p className="text-gray-500 text-sm">Histórico e configurações de envio via WhatsApp</p>
        </div>
      </div>

      <div className="mb-6">
        <MessageTriggerButtons />
      </div>

      <div className="mb-8">
        <MessageSettingsForm settings={settings} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.confirmation}</p>
          <p className="text-xs text-gray-500 mt-1">Confirmações</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.payment}</p>
          <p className="text-xs text-gray-500 mt-1">Links de pagamento</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.reengagement}</p>
          <p className="text-xs text-gray-500 mt-1">Reengajamentos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-400" />
            Histórico de mensagens
          </h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma mensagem enviada ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{log.client.name}</span>
                    <MessageTypeBadge type={log.type} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(log.sentAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{log.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
