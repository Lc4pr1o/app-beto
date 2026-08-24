export const revalidate = 300;

import type { Metadata } from "next";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import {
  MessageCircle,
  MapPin,
  HandHeart,
  Wind,
  Droplets,
  Zap,
  Moon,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });

const WHATSAPP_NUMBER = "5516991358579";
const WHATSAPP_DISPLAY = "(16) 99135-8579";
const INSTAGRAM_HANDLE = "@spalhum";
const INSTAGRAM_URL = "https://www.instagram.com/spalhum";
const ADDRESS = "Rua Barão do Rio Branco, 964 – Serrana, SP";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "Rua Barão do Rio Branco, 964, Serrana, SP"
)}`;

function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const metadata: Metadata = {
  title: "Humberto Bove — Massoterapeuta | Spaço Lhum",
  description:
    "Massoterapia em Serrana/SP. Agende seu horário com Humberto Bove (Spaço Lhum) pelo WhatsApp.",
};

const BENEFITS = [
  { icon: HandHeart, label: "Alivia tensões e dores musculares" },
  { icon: Sparkles, label: "Reduz o estresse e a ansiedade" },
  { icon: Droplets, label: "Melhora a circulação sanguínea" },
  { icon: Zap, label: "Aumenta a disposição e o bem-estar" },
  { icon: Wind, label: "Promove relaxamento profundo" },
  { icon: Moon, label: "Contribui para uma melhor qualidade do sono" },
];

const GALLERY = [
  { src: "/vitrine/massoterapia.jpg", alt: "Sessão de massoterapia no Spaço Lhum" },
  { src: "/vitrine/sessao.jpg", alt: "Humberto Bove aplicando massoterapia" },
  { src: "/vitrine/missao.jpg", alt: "Humberto Bove, massoterapeuta do Spaço Lhum" },
];

async function getServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });
}

export default async function VitrinePage() {
  const services = await getServices();

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-[#3d2e22]">
      {/* Hero */}
      <header className="bg-gradient-to-b from-[#8a6a4b] to-[#6f5439]">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center text-white">
          <p className="uppercase tracking-[0.3em] text-xs sm:text-sm text-white/80 mb-3">
            Spaço Lhum
          </p>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl font-semibold mb-4`}>
            Humberto Bove
          </h1>
          <p className="text-white/90 text-sm sm:text-base mb-1">Massoterapeuta</p>
          <p className="text-lg sm:text-xl mb-8">&ldquo;Massoterapia que cuida de verdade&rdquo;</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={whatsappLink("Olá Humberto, vim pelo site e quero agendar um horário.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#8a6a4b] font-medium px-5 py-3 rounded-full hover:bg-white/90 transition-colors w-full sm:w-auto"
            >
              <MessageCircle size={18} />
              Agendar pelo WhatsApp
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center justify-center gap-2 border border-white/70 text-white font-medium px-5 py-3 rounded-full hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              Ver serviços
            </a>
          </div>
        </div>
      </header>

      {/* Missão */}
      <section className="max-w-3xl mx-auto px-6 py-14 text-center">
        <h2 className={`${playfair.className} text-2xl sm:text-3xl font-semibold mb-4`}>
          Minha missão
        </h2>
        <p className="text-base sm:text-lg text-[#5c4a3a] leading-relaxed">
          Levar autocuidado e alívio de dores físicas e emocionais através das minhas mãos.
        </p>
      </section>

      {/* Benefícios */}
      <section className="bg-white/60 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className={`${playfair.className} text-2xl sm:text-3xl font-semibold text-center mb-10`}>
            Benefícios da massoterapia
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#8a6a4b]/10 flex items-center justify-center text-[#8a6a4b]">
                  <Icon size={22} />
                </div>
                <p className="text-sm text-[#5c4a3a]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="max-w-3xl mx-auto px-6 py-16 scroll-mt-6">
        <h2 className={`${playfair.className} text-2xl sm:text-3xl font-semibold text-center mb-10`}>
          Serviços
        </h2>
        {services.length === 0 ? (
          <p className="text-center text-[#5c4a3a]">
            Fale pelo WhatsApp para conhecer os serviços disponíveis.
          </p>
        ) : (
          <ul className="space-y-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-[#8a6a4b]/15 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#3d2e22]">{service.name}</p>
                  <p className="text-xs text-[#8a6a4b]">{service.durationMins} minutos</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-[#3d2e22]">
                    R$ {service.price.toFixed(2).replace(".", ",")}
                  </span>
                  <a
                    href={whatsappLink(
                      `Olá Humberto, vim pelo site e quero agendar: ${service.name}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium bg-[#8a6a4b] text-white px-3 py-2 rounded-full hover:bg-[#75563a] transition-colors"
                  >
                    Agendar
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Galeria */}
      <section className="bg-white/60 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className={`${playfair.className} text-2xl sm:text-3xl font-semibold text-center mb-10`}>
            Galeria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {GALLERY.map((img) => (
              <div key={img.src} className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#5c4a3a]">
            Mais fotos no Instagram{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#8a6a4b] underline underline-offset-2"
            >
              {INSTAGRAM_HANDLE}
            </a>
          </p>
        </div>
      </section>

      {/* Contato / Localização */}
      <footer className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className={`${playfair.className} text-2xl sm:text-3xl font-semibold mb-6`}>
          Agende seu horário
        </h2>
        <div className="flex flex-col items-center gap-3 text-[#5c4a3a] mb-8">
          <a
            href={whatsappLink("Olá Humberto, vim pelo site e quero agendar um horário.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-medium text-[#3d2e22] hover:text-[#8a6a4b] transition-colors"
          >
            <MessageCircle size={18} />
            {WHATSAPP_DISPLAY}
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm hover:text-[#8a6a4b] transition-colors"
          >
            <MapPin size={16} />
            {ADDRESS}
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:text-[#8a6a4b] transition-colors"
          >
            {INSTAGRAM_HANDLE}
          </a>
        </div>
        <p className="text-xs text-[#8a6a4b]/70">
          Spaço Lhum · Humberto Bove Massoterapeuta
        </p>
      </footer>
    </div>
  );
}
