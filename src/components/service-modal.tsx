"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil } from "lucide-react";

type Service = { id: string; name: string; durationMins: number; price: number; active: boolean };

function ServiceForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Service>;
  onSave: (data: { name: string; durationMins: number; price: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [duration, setDuration] = useState(String(initial?.durationMins ?? 60));
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price.replace(",", "."));
    const d = parseInt(duration);
    if (!name.trim() || isNaN(p) || isNaN(d)) {
      setError("Preencha todos os campos corretamente.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({ name: name.trim(), durationMins: d, price: p });
      onClose();
    } catch {
      setError("Erro ao salvar serviço.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome do serviço</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Massagem relaxante"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Duração (minutos)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={5}
            step={5}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Preço (R$)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            required
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function NewServiceModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSave(data: { name: string; durationMins: number; price: number }) {
    const res = await fetch("/api/servicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar serviço");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
      >
        <Plus size={16} />
        Novo Serviço
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Novo serviço</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <ServiceForm onSave={handleSave} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export function EditServiceModal({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSave(data: { name: string; durationMins: number; price: number }) {
    const res = await fetch(`/api/servicos/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar serviço");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Excluir o serviço "${service.name}"?`)) return;
    await fetch(`/api/servicos/${service.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
      >
        <Pencil size={14} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Editar serviço</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  Excluir
                </button>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
            </div>
            <ServiceForm initial={service} onSave={handleSave} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
