export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listUpcomingEvents,
  parseEventTitle,
  createCalendarEvent,
} from "@/lib/google-calendar";

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    // ── Fase 1: Importar eventos do Google Calendar ──────────────
    const events = await listUpcomingEvents(60);
    let processed = 0;

    for (const event of events) {
      if (!event.id || !event.summary || !event.start?.dateTime) continue;

      const { clientName, serviceType } = parseEventTitle(event.summary);
      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end?.dateTime ?? event.start.dateTime);

      let client = await prisma.client.findFirst({
        where: { name: { equals: clientName, mode: "insensitive" } },
      });

      if (!client) {
        const phonePlaceholder = `0${Buffer.from(clientName.toLowerCase()).toString("hex").slice(0, 9)}`;
        client = await prisma.client.create({
          data: { name: clientName, phone: phonePlaceholder },
        });
      }

      await prisma.appointment.upsert({
        where: { googleEventId: event.id },
        update: {
          title: event.summary,
          serviceType,
          startTime,
          endTime,
          status: event.status === "cancelled" ? "CANCELLED" : "SCHEDULED",
        },
        create: {
          googleEventId: event.id,
          clientId: client.id,
          title: event.summary,
          serviceType,
          startTime,
          endTime,
        },
      });

      processed++;
    }

    // ── Fase 2: Exportar agendamentos sem googleEventId para o GCal ──
    const unsynced = await prisma.appointment.findMany({
      where: {
        googleEventId: null,
        status: { not: "CANCELLED" },
        startTime: { gte: new Date() },
      },
      include: { client: true },
    });

    let exported = 0;
    for (const appt of unsynced) {
      try {
        const googleEventId = await createCalendarEvent({
          title: appt.title,
          startTime: appt.startTime,
          endTime: appt.endTime,
        });
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { googleEventId },
        });
        exported++;
      } catch {
        // Continua para os próximos
      }
    }

    await prisma.syncLog.create({ data: { eventsProcessed: processed } });

    return NextResponse.json({ ok: true, processed, exported });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncLog.create({ data: { errors: message } });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
