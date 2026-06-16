import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DEFAULT_SERVICES = [
  { name: "Massagem Relaxante", durationMins: 60, price: 150 },
  { name: "Massagem Terapêutica", durationMins: 60, price: 170 },
  { name: "Drenagem Linfática", durationMins: 60, price: 180 },
  { name: "Reflexologia", durationMins: 45, price: 120 },
  { name: "Hot Stone", durationMins: 90, price: 220 },
];

export async function GET() {
  let services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Auto-seed na primeira chamada
  if (services.length === 0) {
    await prisma.service.createMany({ data: DEFAULT_SERVICES });
    services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  return NextResponse.json(services);
}

const createSchema = z.object({
  name: z.string().min(2),
  durationMins: z.number().int().min(15),
  price: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  const service = await prisma.service.create({ data: body.data });
  return NextResponse.json(service, { status: 201 });
}
