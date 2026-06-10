export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { SyncButton } from "@/components/sync-button";

export default async function AgendaPage() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: weekStart, lte: weekEnd },
      status: { not: "CANCELLED" },
    },
    include: { client: true },
    orderBy: { startTime: "asc" },
  });

  // Agrupa por dia
  const byDay: Record<string, typeof appointments> = {};
  for (const appt of appointments) {
    const key = format(appt.startTime, "yyyy-MM-dd");
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(appt);
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-gray-500 text-sm">
            Semana de {format(weekStart, "dd/MM", { locale: ptBR })} a{" "}
            {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="space-y-4">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = byDay[key] ?? [];
          const isToday = key === format(today, "yyyy-MM-dd");

          return (
            <div key={key} className={`bg-white rounded-xl border p-4 ${isToday ? "border-violet-300 ring-1 ring-violet-200" : "border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {format(day, "d")}
                </div>
                <div>
                  <p className={`text-sm font-medium capitalize ${isToday ? "text-violet-700" : "text-gray-700"}`}>
                    {format(day, "EEEE", { locale: ptBR })}
                    {isToday && " (hoje)"}
                  </p>
                </div>
              </div>

              {dayAppts.length === 0 ? (
                <p className="text-gray-300 text-xs ml-10">Sem atendimentos</p>
              ) : (
                <ul className="space-y-2 ml-10">
                  {dayAppts.map((appt) => (
                    <li key={appt.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24">
                          {format(appt.startTime, "HH:mm")} – {format(appt.endTime, "HH:mm")}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {appt.client?.name ?? appt.title}
                        </span>
                      </div>
                      <StatusBadge status={appt.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
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
