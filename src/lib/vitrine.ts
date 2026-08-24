export const BETO_PHONE = "5516991358579";
export const BETO_PHONE_DISPLAY = "(16) 99135-8579";
export const INSTAGRAM_HANDLE = "@spalhum";
export const INSTAGRAM_URL = "https://www.instagram.com/spalhum";
export const ADDRESS = "Rua Barão do Rio Branco, 964 – Serrana, SP";
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "Rua Barão do Rio Branco, 964, Serrana, SP"
)}`;

export const BUSINESS_START_H = 8;
export const BUSINESS_END_H = 18;

/** Minutos mínimos de antecedência para uma reserva online (dá tempo do Beto se preparar). */
export const MIN_LEAD_MINUTES = 120;

export function whatsappLink(message: string, phone: string = BETO_PHONE) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
