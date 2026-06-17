"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

export function EditClientForm({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: client.name,
    phone: client.phone === "00000000000" ? "" : client.phone,
    email: client.email ?? "",
    notes: client.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || "00000000000",
          email: form.email || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        const fieldErrors = data.error?.fieldErrors;
        setError(fieldErrors?.phone?.[0] ?? fieldErrors?.name?.[0] ?? "Erro ao salvar cliente");
        return;
      }
      setOpen(false);
      window.location.reload();
    } catch {
      setError("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        <Pencil size={13} />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Editar cliente</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefone (WhatsApp)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.phone}
                  placeholder="5511999999999"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">E-mail (opcional)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Observações</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-medium"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
