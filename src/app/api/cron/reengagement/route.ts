import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendText, buildReengagementMessage } from "@/lib/evolution";

// Chamado todo dia às 9h via Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  // Clientes cujo último atendimento foi há mais de 15 dias
  const clients = await prisma.client.findMany({
    where: {
      phone: { not: "00000000000" },
      AND: [
        {
          appointments: {
            none: {
              startTime: { gte: fifteenDaysAgo },
              status: { in: ["SCHEDULED", "CONFIRMED", "DONE"] },
            },
          },
        },
        { appointments: { some: {} } },
      ],
    },
    include: {
      whatsappLogs: {
        where: { type: "REENGAGEMENT" },
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });

  let sent = 0;
  for (const client of clients) {
    // Não envia de novo se já enviou nos últimos 15 dias
    const lastMsg = client.whatsappLogs[0];
    if (lastMsg) {
      const daysSince = (Date.now() - lastMsg.sentAt.getTime()) / 86400000;
      if (daysSince < 15) continue;
    }

    try {
      const message = buildReengagementMessage(client.name);
      await sendText(client.phone, message);

      await prisma.whatsappLog.create({
        data: { clientId: client.id, type: "REENGAGEMENT", message },
      });

      sent++;
    } catch {
      // Continua
    }
  }

  return NextResponse.json({ ok: true, sent });
}
