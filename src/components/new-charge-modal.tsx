"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

type Client = { id: string; name: string; phone: string };

export function NewChargeModal({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const showDropdown = clientSearch.length > 0 && !clientId;

  function handleClose() {
    setOpen(false);
    setClientSearch("");
    setClientId("");
    setAmount("");
    setDescription("");
    setError("");
  }

  async function handleSubmit() {
    if (!clientId || !amount) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, amount: Number(amount), description: description || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Erro ao gerar cobrança");
        return;
      }
      handleClose();
      router.refresh();
    } catch {
      setError("Erro ao gerar cobrança");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
      >
        <Plus size={16} />
        Nova Cobrança
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Nova Cobrança</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Cliente</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente pelo nome..."
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setClientId(""); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              {showDropdown && (
                <ul className="absolute z-10 w-full border border-gray-200 rounded-lg mt-1 bg-white shadow-lg max-h-48 overflow-y-auto">
                  {filtered.length > 0 ? (
                    filtered.slice(0, 8).map((c) => (
                      <li
                        key={c.id}
                        onClick={() => { setClientId(c.id); setClientSearch(c.name); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 flex justify-between"
                      >
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <span className="text-gray-400 text-xs">{c.phone}</span>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-gray-400">Nenhum cliente encontrado</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Valor (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Descrição <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Sessão de massagem"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!clientId || !amount || loading}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Gerando..." : "Gerar Pix e enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
