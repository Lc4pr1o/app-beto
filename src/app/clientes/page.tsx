export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Phone, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    include: {
      appointments: { orderBy: { startTime: "desc" }, take: 1 },
      payments: { where: { status: { in: ["PENDING", "SENT"] } } },
      planSubscriptions: { where: { active: true }, include: { plan: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-500 text-sm">{clients.length} cadastrados</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum cliente ainda.</p>
          <p className="text-gray-400 text-sm mt-1">
            Sincronize a agenda para importar clientes automaticamente.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {clients.map((client) => {
            const lastAppt = client.appointments[0];
            const pendingCount = client.payments.length;
            const activePlan = client.planSubscriptions[0];

            return (
              <Link
                key={client.id}
                href={`/clientes/${client.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {client.phone !== "00000000000" && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={10} />
                          {client.phone}
                        </span>
                      )}
                      {lastAppt && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {format(lastAppt.startTime, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activePlan && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      {activePlan.plan.name}
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle size={10} />
                      {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
