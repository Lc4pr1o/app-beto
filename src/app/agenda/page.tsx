export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format, startOfWeek, endOfWeek, addWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { nowBR } from "@/lib/date";
import { NewAppointmentModal } from "@/components/new-appointment-modal";
import { AppointmentActions } from "@/components/appointment-actions";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const today = nowBR();

  const baseDate = week ? parseISO(week) : today;
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });

  const [appointments, clients] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startTime: { gte: weekStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
      include: { client: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
  ]);

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

  const prevWeek = format(addWeeks(weekStart, -1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");
  const currentWeek = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const isCurrentWeek = format(weekStart, "yyyy-MM-dd") === currentWeek;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-gray-500 text-sm">
            {format(weekStart, "dd/MM", { locale: ptBR })} a{" "}
            {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegação de semana */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <Link
              href={`/agenda?week=${prevWeek}`}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft size={16} />
            </Link>
            {!isCurrentWeek && (
              <Link href="/agenda" className="text-xs text-violet-600 hover:text-violet-700 px-2 font-medium">
                Hoje
              </Link>
            )}
            <Link
              href={`/agenda?week=${nextWeek}`}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight size={16} />
            </Link>
          </div>

          <NewAppointmentModal clients={clients} />
        </div>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = byDay[key] ?? [];
          const isToday = key === format(today, "yyyy-MM-dd");

          return (
            <div
              key={key}
              className={`bg-white rounded-xl border p-4 ${
                isToday
                  ? "border-violet-300 ring-1 ring-violet-200"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isToday
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <p
                  className={`text-sm font-medium capitalize ${
                    isToday ? "text-violet-700" : "text-gray-700"
                  }`}
                >
                  {format(day, "EEEE", { locale: ptBR })}
                  {isToday && " (hoje)"}
                </p>
                {dayAppts.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400">
                    {dayAppts.length} atendimento{dayAppts.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {dayAppts.length === 0 ? (
                <p className="text-gray-300 text-xs ml-10">Sem atendimentos</p>
              ) : (
                <ul className="space-y-2.5 ml-10">
                  {dayAppts.map((appt) => (
                    <li
                      key={appt.id}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-gray-400 shrink-0 w-24">
                          {format(appt.startTime, "HH:mm")} –{" "}
                          {format(appt.endTime, "HH:mm")}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-800 block truncate">
                            {appt.client?.name ?? appt.title}
                          </span>
                          <span className="text-xs text-gray-400">
                            {appt.serviceType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={appt.status} />
                        <AppointmentActions
                          appointmentId={appt.id}
                          status={appt.status as "SCHEDULED" | "CONFIRMED" | "DONE" | "CANCELLED"}
                        />
                      </div>
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
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.className}`}>
      {s.label}
    </span>
  );
}
