import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { businessHoursRangeBR } from "@/lib/date";
import { BUSINESS_START_H, BUSINESS_END_H, MIN_LEAD_MINUTES } from "@/lib/vitrine";

// Horários "isca" usados quando o dia ainda não tem nenhum agendamento
// que sirva de âncora para a regra de antes/depois.
const FALLBACK_HOURS = [9, 15];

const MAX_SLOTS = 3;

type Range = { start: Date; end: Date };

function overlaps(a: Range, existing: Range[]): boolean {
  return existing.some((e) => a.start < e.end && a.end > e.start);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const durationMins = parseInt(searchParams.get("duration") ?? "60");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Parâmetro date obrigatório (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Number.isFinite(durationMins) || durationMins <= 0) {
    return NextResponse.json({ error: "Parâmetro duration inválido" }, { status: 400 });
  }

  const { start: businessStart, end: businessEnd } = businessHoursRangeBR(
    dateStr,
    BUSINESS_START_H,
    BUSINESS_END_H
  );
  const durationMs = durationMins * 60 * 1000;
  const earliestStart = new Date(Date.now() + MIN_LEAD_MINUTES * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: { not: "CANCELLED" },
      startTime: { lt: businessEnd },
      endTime: { gt: businessStart },
    },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });
  const existingRanges: Range[] = appointments.map((a) => ({ start: a.startTime, end: a.endTime }));

  function isValidCandidate(candidate: Range): boolean {
    return (
      candidate.start >= businessStart &&
      candidate.end <= businessEnd &&
      candidate.start >= earliestStart &&
      !overlaps(candidate, existingRanges)
    );
  }

  const candidates = new Map<number, Range>();

  for (const appt of appointments) {
    const before: Range = { start: new Date(appt.startTime.getTime() - durationMs), end: appt.startTime };
    if (isValidCandidate(before)) candidates.set(before.start.getTime(), before);

    const after: Range = { start: appt.endTime, end: new Date(appt.endTime.getTime() + durationMs) };
    if (isValidCandidate(after)) candidates.set(after.start.getTime(), after);
  }

  if (candidates.size === 0) {
    for (const hour of FALLBACK_HOURS) {
      const start = new Date(businessStart.getTime() + (hour - BUSINESS_START_H) * 60 * 60 * 1000);
      const candidate: Range = { start, end: new Date(start.getTime() + durationMs) };
      if (isValidCandidate(candidate)) candidates.set(candidate.start.getTime(), candidate);
    }
  }

  const slots = Array.from(candidates.values())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, MAX_SLOTS)
    .map((r) => ({ start: r.start.toISOString(), end: r.end.toISOString() }));

  return NextResponse.json(slots);
}
