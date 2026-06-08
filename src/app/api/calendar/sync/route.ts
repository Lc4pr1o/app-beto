import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listUpcomingEvents, parseEventTitle } from "@/lib/google-calendar";

export async function POST() {
  try {
    const events = await listUpcomingEvents(60);
    let processed = 0;

    for (const event of events) {
      if (!event.id || !event.summary || !event.start?.dateTime) continue;

      const { clientName } = parseEventTitle(event.summary);
      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end?.dateTime ?? event.start.dateTime);

      // Busca ou cria o cliente pelo nome
      let client = await prisma.client.findFirst({
        where: { name: { equals: clientName, mode: "insensitive" } },
      });

      if (!client) {
        client = await prisma.client.create({
          data: { name: clientName, phone: "00000000000" },
        });
      }

      // Upsert do agendamento
      await prisma.appointment.upsert({
        where: { googleEventId: event.id },
        update: {
          title: event.summary,
          startTime,
          endTime,
          status: event.status === "cancelled" ? "CANCELLED" : "SCHEDULED",
        },
        create: {
          googleEventId: event.id,
          clientId: client.id,
          title: event.summary,
          startTime,
          endTime,
        },
      });

      processed++;
    }

    await prisma.syncLog.create({ data: { eventsProcessed: processed } });

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncLog.create({ data: { errors: message } });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
