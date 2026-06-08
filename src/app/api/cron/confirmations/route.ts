import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendText, buildConfirmationMessage } from "@/lib/evolution";

// Chamado todo dia às 18h via Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: tomorrow, lte: tomorrowEnd },
      status: "SCHEDULED",
      confirmationSentAt: null,
    },
    include: { client: true },
  });

  let sent = 0;
  for (const appt of appointments) {
    if (!appt.client?.phone || appt.client.phone === "00000000000") continue;

    try {
      const message = buildConfirmationMessage(appt.client.name, appt.startTime);
      await sendText(appt.client.phone, message);

      await prisma.appointment.update({
        where: { id: appt.id },
        data: { confirmationSentAt: new Date() },
      });

      await prisma.whatsappLog.create({
        data: {
          clientId: appt.client.id,
          type: "CONFIRMATION",
          message,
        },
      });

      sent++;
    } catch {
      // Continua para os próximos mesmo se um falhar
    }
  }

  return NextResponse.json({ ok: true, sent });
}
