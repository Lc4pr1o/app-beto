"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Clock, UserPlus, DollarSign } from "lucide-react";

type Client = { id: string; name: string; phone: string };
type Service = { id: string; name: string; durationMins: number; price: number };
type Slot = { start: string; end: string; available: boolean };

export function NewAppointmentModal({ clients: initialClients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Clientes (pode crescer com criação inline)
  const [clients, setClients] = useState<Client[]>(initialClients);

  // Campos do formulário
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");

  // Criação inline de cliente
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientError, setNewClientError] = useState("");

  // Cobrança opcional
  const [createPayment, setCreatePayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Estado assíncrono
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedService = services.find((s) => s.id === serviceId);
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const showDropdown = clientSearch.length > 0 && !clientId;

  // Carregar serviços ao abrir
  useEffect(() => {
    if (!open || services.length > 0) return;
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(data);
        if (data.length > 0) {
          setServiceId(data[0].id);
          setPaymentAmount(String(data[0].price));
        }
      });
  }, [open, services.length]);

  // Atualizar preço sugerido ao trocar serviço
  useEffect(() => {
    if (selectedService) setPaymentAmount(String(selectedService.price));
  }, [selectedService]);

  // Carregar slots ao mudar data ou serviço
  useEffect(() => {
    if (!date || !selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/availability?date=${date}&duration=${selectedService.durationMins}`)
      .then((r) => r.json())
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [date, selectedService]);

  function resetForm() {
    setClientSearch("");
    setClientId("");
    setDate("");
    setSelectedSlot(null);
    setNotes("");
    setSlots([]);
    setError("");
    setShowNewClient(false);
    setNewClientPhone("");
    setNewClientError("");
    setCreatePayment(false);
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleCreateClient() {
    if (!clientSearch.trim() || !newClientPhone.trim()) return;
    setCreatingClient(true);
    setNewClientError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientSearch.trim(), phone: newClientPhone.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        const fieldErrors = data.error?.fieldErrors;
        setNewClientError(fieldErrors?.phone?.[0] ?? fieldErrors?.name?.[0] ?? "Erro ao criar cliente");
        return;
      }

      const created: Client = await res.json();
      setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setClientId(created.id);
      setClientSearch(created.name);
      setShowNewClient(false);
      setNewClientPhone("");
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSubmit() {
    if (!clientId || !selectedSlot || !selectedService) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          serviceType: selectedService.name,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          notes: notes || undefined,
          amount: createPayment && paymentAmount ? Number(paymentAmount) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Erro ao criar agendamento");
        return;
      }

      handleClose();
      router.refresh();
    } catch {
      setError("Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
      >
        <Plus size={16} />
        Novo Agendamento
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Novo Agendamento</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Cliente */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Cliente</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente pelo nome..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientId("");
                  setShowNewClient(false);
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />

              {showDropdown && (
                <ul className="absolute z-10 w-full border border-gray-200 rounded-lg mt-1 bg-white shadow-lg">
                  {filteredClients.length > 0 ? (
                    filteredClients.slice(0, 6).map((c) => (
                      <li
                        key={c.id}
                        onClick={() => { setClientId(c.id); setClientSearch(c.name); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 flex justify-between"
                      >
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <span className="text-gray-400 text-xs">{c.phone}</span>
                      </li>
                    ))
                  ) : null}

                  {/* Opção de criar novo cliente */}
                  {clientSearch.trim().length >= 2 && (
                    <li
                      onClick={() => setShowNewClient(true)}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-green-50 flex items-center gap-2 border-t border-gray-100 text-green-700"
                    >
                      <UserPlus size={14} />
                      Criar cliente "{clientSearch.trim()}"
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Mini-form de criação inline */}
            {showNewClient && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
                <p className="text-xs font-medium text-green-800">Novo cliente: {clientSearch.trim()}</p>
                <input
                  autoFocus
                  type="tel"
                  placeholder="WhatsApp (somente números, com DDD)"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateClient(); }}
                  className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                />
                {newClientError && <p className="text-xs text-red-600">{newClientError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateClient}
                    disabled={creatingClient || !newClientPhone.trim()}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {creatingClient ? "Criando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => { setShowNewClient(false); setNewClientPhone(""); }}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Serviço</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.durationMins}min — R$ {s.price.toFixed(2).replace(".", ",")}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Data</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Horários disponíveis */}
          {date && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                <Clock size={13} className="inline mr-1" />
                Horário disponível
              </label>
              {loadingSlots ? (
                <p className="text-sm text-gray-400">Carregando horários...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum horário disponível nesta data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
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
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`text-xs py-2 rounded-lg font-medium border transition-colors ${
                          !slot.available
                            ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                            : isSelected
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
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

          {/* Observações */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Observações <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Preferências, histórico, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
          </div>

          {/* Cobrança */}
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createPayment}
                onChange={(e) => setCreatePayment(e.target.checked)}
                className="accent-violet-600"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <DollarSign size={14} className="text-amber-500" />
                Gerar cobrança para este agendamento
              </span>
            </label>
            {createPayment && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-500">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                />
                <span className="text-xs text-gray-400">Valor da sessão</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!clientId || !selectedSlot || loading}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Salvando..." : "Confirmar Agendamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
