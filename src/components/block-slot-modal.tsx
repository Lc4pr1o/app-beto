"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BanIcon, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type BlockedSlot = { id: string; startTime: string; endTime: string; reason?: string | null };

export function BlockSlotModal({
  currentDate,
  blockedSlots,
}: {
  currentDate: string;
  blockedSlots: BlockedSlot[];
}) {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const daySlots = blockedSlots.filter((s) =>
    s.startTime.startsWith(currentDate)
  );

  async function handleBlock() {
    setLoading(true);
    setError("");
    try {
      const start = new Date(`${currentDate}T${startTime}:00-03:00`);
      const end = new Date(`${currentDate}T${endTime}:00-03:00`);
      if (end <= start) {
        setError("Horário de fim deve ser após o início.");
        return;
      }
      const res = await fetch("/api/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      setOpen(false);
      setReason("");
    } catch {
      setError("Erro ao bloquear horário.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
      >
        <BanIcon size={13} />
        Bloquear horário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Bloquear horário</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Início</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Fim</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Motivo (opcional)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Almoço, Feriado..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>

              {daySlots.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Já bloqueado hoje:</p>
                  <div className="space-y-1">
                    {daySlots.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs bg-red-50 rounded-lg px-3 py-1.5">
                        <span className="text-red-700">
                          {format(new Date(s.startTime), "HH:mm")} – {format(new Date(s.endTime), "HH:mm")}
                          {s.reason && ` · ${s.reason}`}
                        </span>
                        <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-700 ml-2">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleBlock} disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {loading ? "Bloqueando..." : "Bloquear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
