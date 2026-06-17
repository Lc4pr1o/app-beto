"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Check, Phone, Search } from "lucide-react";

type Contact = {
  name: string;
  phones: string[];
  email?: string;
};

type Selection = {
  name: string;
  phone: string;
  email?: string;
};

export function ImportarClient() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [search, setSearch] = useState("");

  // Seleção: map de índice → phone escolhido
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  useEffect(() => {
    fetch("/api/contacts/list", { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) { setNeedsAuth(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setContacts(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleContact(index: number, contact: Contact) {
    setSelections((prev) => {
      if (prev[index] !== undefined) {
        const next = { ...prev };
        delete next[index];
        return next;
      }
      return { ...prev, [index]: contact.phones[0] };
    });
  }

  function setPhone(index: number, phone: string) {
    setSelections((prev) => ({ ...prev, [index]: phone }));
  }

  const selectedCount = Object.keys(selections).length;

  async function handleImport() {
    if (selectedCount === 0) return;
    setImporting(true);

    const payload: Selection[] = Object.entries(selections).map(([idx, phone]) => {
      const c = contacts[Number(idx)];
      return { name: c.name, phone, email: c.email };
    });

    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: payload }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setImporting(false);
    }
  }

  // Tela de sucesso
  if (result) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Importação concluída!</h2>
        <p className="text-gray-500 text-sm mb-1">
          <strong>{result.imported}</strong> cliente{result.imported !== 1 ? "s" : ""} importado{result.imported !== 1 ? "s" : ""}
        </p>
        {result.skipped > 0 && (
          <p className="text-gray-400 text-xs mb-5">
            {result.skipped} ignorado{result.skipped !== 1 ? "s" : ""} (telefone já cadastrado)
          </p>
        )}
        <button
          onClick={() => router.push("/clientes")}
          className="bg-violet-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700"
        >
          Ver Clientes
        </button>
      </div>
    );
  }

  // Tela de autenticação necessária
  if (needsAuth) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Link href="/clientes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={26} className="text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Importar Contatos do Google</h2>
          <p className="text-gray-500 text-sm mb-6">
            Conecte sua conta Google para importar contatos diretamente para o sistema.
          </p>
          <a
            href="/api/contacts/auth"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Globe size={16} className="text-blue-500" />
            Continuar com Google
          </a>
          <p className="text-xs text-gray-400 mt-4">
            Acesso somente leitura aos seus contatos. Nenhum dado é alterado no Google.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="h-8 bg-gray-100 rounded w-48 mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/clientes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Importar Contatos</h2>
          <p className="text-gray-500 text-sm">{contacts.length} contatos encontrados com telefone</p>
        </div>
        {selectedCount > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {importing ? "Importando..." : `Importar ${selectedCount} selecionado${selectedCount !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar contato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>

      {/* Selecionar todos / nenhum */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <button
          onClick={() => {
            const all: Record<number, string> = {};
            filtered.forEach((c, i) => {
              const realIndex = contacts.indexOf(c);
              all[realIndex] = c.phones[0];
            });
            setSelections(all);
          }}
          className="hover:text-violet-600"
        >
          Selecionar todos
        </button>
        <button onClick={() => setSelections({})} className="hover:text-gray-700">
          Desmarcar todos
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">Nenhum contato encontrado.</p>
        ) : (
          filtered.map((contact) => {
            const realIndex = contacts.indexOf(contact);
            const isSelected = selections[realIndex] !== undefined;

            return (
              <div
                key={realIndex}
                className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? "bg-violet-50" : ""}`}
                onClick={() => toggleContact(realIndex, contact)}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                  {contact.email && (
                    <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                  )}
                </div>

                {/* Seletor de telefone */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  {contact.phones.length === 1 ? (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone size={11} />
                      {contact.phones[0]}
                    </span>
                  ) : (
                    <select
                      value={selections[realIndex] ?? contact.phones[0]}
                      onChange={(e) => { setPhone(realIndex, e.target.value); if (!isSelected) toggleContact(realIndex, contact); }}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-300"
                    >
                      {contact.phones.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCount > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-violet-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {importing ? "Importando..." : `Importar ${selectedCount} contato${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
