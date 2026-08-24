import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AgendarForm } from "@/components/vitrine/agendar-form";

export const metadata: Metadata = {
  title: "Agendar horário — Humberto Bove | Spaço Lhum",
  description: "Reserve seu horário de massoterapia com Humberto Bove no Spaço Lhum.",
};

async function getServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });
}

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string }>;
}) {
  const [{ servico }, services] = await Promise.all([searchParams, getServices()]);

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-[#3d2e22] px-6 py-12 sm:py-16">
      <AgendarForm services={services} initialServiceId={servico} />
    </div>
  );
}
