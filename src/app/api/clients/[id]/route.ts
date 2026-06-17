import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { startTime: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      planSubscriptions: { include: { plan: true }, orderBy: { purchasedAt: "desc" } },
      whatsappLogs: { orderBy: { sentAt: "desc" }, take: 20 },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  try {
    const client = await prisma.client.update({ where: { id }, data: body.data });
    return NextResponse.json(client);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: { fieldErrors: { phone: ["Telefone já cadastrado para outro cliente"] } } },
        { status: 409 }
      );
    }
    throw err;
  }
}
