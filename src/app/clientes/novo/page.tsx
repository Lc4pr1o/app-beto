"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function NovoClientePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const fieldErrors = data.error?.fieldErrors;
        setError(
          fieldErrors?.phone?.[0] ??
            fieldErrors?.name?.[0] ??
            fieldErrors?.email?.[0] ??
            "Erro ao cadastrar cliente"
        );
        return;
      }

      const client = await res.json();
      router.push(`/clientes/${client.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link
        href="/clientes"
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6"
      >
        <ArrowLeft size={14} />
        Voltar para Clientes
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <UserPlus size={18} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Novo Cliente</h2>
          <p className="text-gray-500 text-sm">Preencha os dados para cadastrar</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Nome completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={set("name")}
              placeholder="Ex: Maria Silva"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              WhatsApp <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={set("phone")}
              placeholder="11999999999"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <p className="text-xs text-gray-400 mt-1">Somente números, com DDD. Ex: 11999999999</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Email <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="maria@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Observações <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Preferências, histórico de saúde, alergias, etc."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/clientes"
              className="flex-1 text-center border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Salvando..." : "Cadastrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
