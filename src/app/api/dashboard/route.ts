import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

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
    }),

    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),

    prisma.client.count(),
  ]);

  return NextResponse.json({
    todayAppointments,
    pendingPayments,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    totalClients,
  });
}
