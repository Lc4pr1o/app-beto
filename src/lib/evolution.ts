import axios from "axios";

const api = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    apikey: process.env.EVOLUTION_API_KEY,
    "Content-Type": "application/json",
  },
});

const INSTANCE = process.env.EVOLUTION_INSTANCE ?? "beto";

function formatPhone(phone: string): string {
  // Remove tudo que não é número e garante código do país
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export async function sendText(phone: string, message: string) {
  const number = formatPhone(phone);
  const res = await api.post(`/message/sendText/${INSTANCE}`, {
    number,
    text: message,
  });
  return res.data;
}

export function buildConfirmationMessage(clientName: string, date: Date): string {
  const hora = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    `Olá ${clientName}! 👋\n\n` +
    `Confirmando seu atendimento *amanhã* às *${hora}*.\n\n` +
    `Responda *SIM* para confirmar ou *NÃO* para cancelar.\n\n` +
    `Qualquer dúvida, pode chamar! 😊`
  );
}

export function buildPaymentMessage(clientName: string, amount: number, pixCode: string): string {
  return (
    `Olá ${clientName}! Obrigado pela visita! 🙏\n\n` +
    `Segue o Pix para o pagamento de *R$ ${amount.toFixed(2).replace(".", ",")}*:\n\n` +
    `\`${pixCode}\`\n\n` +
    `Qualquer dúvida, estou à disposição!`
  );
}

export function buildReengagementMessage(clientName: string): string {
  return (
    `Oii ${clientName}! Tudo bem? 😊\n\n` +
    `Faz um tempinho que você não aparece por aqui... que tal agendar uma sessão?\n\n` +
    `Me chama e a gente marca! 💆‍♀️`
  );
}
