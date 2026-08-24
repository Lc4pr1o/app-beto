"use client";

import { useState, useEffect, useMemo } from "react";
import { Playfair_Display } from "next/font/google";
import { CalendarCheck, Clock, MessageCircle, CheckCircle2 } from "lucide-react";
import { whatsappLink } from "@/lib/vitrine";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });

type Service = { id: string; name: string; durationMins: number; price: number };
type Slot = { start: string; end: string };

function todayBR(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export function AgendarForm({
  services,
  initialServiceId,
}: {
  services: Service[];
  initialServiceId?: string;
}) {
  const [serviceId, setServiceId] = useState(
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : services[0]?.id ?? ""
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{ dateLabel: string; serviceName: string } | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const today = useMemo(() => todayBR(), []);

  useEffect(() => {
    if (!date || !service) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setError("");
    fetch(`/api/vitrine/availability?date=${date}&duration=${service.durationMins}`)
      .then((r) => r.json())
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [date, service]);

  async function handleSubmit() {
    if (!service || !selectedSlot || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/vitrine/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          serviceId: service.id,
          startTime: selectedSlot.start,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Não foi possível reservar esse horário.");
        if (res.status === 409 && date) {
          fetch(`/api/vitrine/availability?date=${date}&duration=${service.durationMins}`)
            .then((r) => r.json())
            .then(setSlots);
          setSelectedSlot(null);
        }
        return;
      }

      setConfirmed({
        dateLabel: new Date(data.startTime).toLocaleString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        }),
        serviceName: data.serviceName,
      });
    } catch {
      setError("Não foi possível enviar sua reserva. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-[#8a6a4b]/15 p-8">
        <CheckCircle2 size={40} className="text-[#8a6a4b] mx-auto mb-4" />
        <h1 className={`${playfair.className} text-2xl font-semibold mb-3`}>Pedido recebido!</h1>
        <p className="text-[#5c4a3a] text-sm mb-1">
          {confirmed.serviceName} — {confirmed.dateLabel}
        </p>
        <p className="text-[#5c4a3a] text-sm mb-6">
          Você vai receber a confirmação pelo WhatsApp. Qualquer coisa, é só chamar.
        </p>
        <a
          href={whatsappLink("Olá Humberto, acabei de reservar um horário pelo site!")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#8a6a4b] text-white font-medium px-5 py-3 rounded-full hover:bg-[#75563a] transition-colors"
        >
          <MessageCircle size={18} />
          Falar no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <CalendarCheck size={28} className="text-[#8a6a4b] mx-auto mb-3" />
        <h1 className={`${playfair.className} text-3xl font-semibold mb-2`}>Agendar horário</h1>
        <p className="text-[#5c4a3a] text-sm">Spaço Lhum · Humberto Bove Massoterapeuta</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#8a6a4b]/15 p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-[#3d2e22] block mb-1.5">Serviço</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full border border-[#8a6a4b]/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8a6a4b]/40 bg-white"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.durationMins}min — a partir de R$ {s.price.toFixed(2).replace(".", ",")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[#3d2e22] block mb-1.5">Data</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-[#8a6a4b]/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8a6a4b]/40 bg-white"
          />
        </div>

        {date && (
          <div>
            <label className="text-sm font-medium text-[#3d2e22] block mb-2">
              <Clock size={13} className="inline mr-1" />
              Horários disponíveis
            </label>
            {loadingSlots ? (
              <p className="text-sm text-[#8a6a4b]">Carregando...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[#5c4a3a]">
                Nenhum horário disponível nessa data.{" "}
                <a
                  href={whatsappLink("Olá Humberto, vim pelo site e quero agendar um horário.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium"
                >
                  Fale no WhatsApp
                </a>
                .
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const time = new Date(slot.start).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  });
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`text-sm py-2.5 rounded-lg font-medium border transition-colors ${
                        isSelected
                          ? "border-[#8a6a4b] bg-[#8a6a4b] text-white"
                          : "border-[#8a6a4b]/25 text-[#3d2e22] hover:border-[#8a6a4b]"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedSlot && (
          <>
            <div>
              <label className="text-sm font-medium text-[#3d2e22] block mb-1.5">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                className="w-full border border-[#8a6a4b]/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8a6a4b]/40 bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#3d2e22] block mb-1.5">WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(16) 99999-9999"
                className="w-full border border-[#8a6a4b]/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8a6a4b]/40 bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#3d2e22] block mb-1.5">
                Observações <span className="text-[#8a6a4b]/70 font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Alguma preferência ou informação?"
                className="w-full border border-[#8a6a4b]/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8a6a4b]/40 bg-white resize-none"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedSlot || !name.trim() || !phone.trim() || submitting}
          className="w-full bg-[#8a6a4b] text-white py-3 rounded-full text-sm font-medium hover:bg-[#75563a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Enviando..." : "Confirmar reserva"}
        </button>
      </div>
    </div>
  );
}
