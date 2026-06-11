const BR_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Início do dia atual (00:00 horário de Brasília), retornado como Date UTC equivalente. */
export function startOfTodayBR(): Date {
  const brNow = new Date(Date.now() - BR_OFFSET_MS);
  return new Date(
    Date.UTC(brNow.getUTCFullYear(), brNow.getUTCMonth(), brNow.getUTCDate(), 0, 0, 0, 0) +
      BR_OFFSET_MS
  );
}

/** Fim do dia atual (23:59:59.999 horário de Brasília). */
export function endOfTodayBR(): Date {
  return new Date(startOfTodayBR().getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** Data/hora atual ajustada para horário de Brasília (campos UTC = campos BR). */
export function nowBR(): Date {
  return new Date(Date.now() - BR_OFFSET_MS);
}

/** Formata uma data no padrão "Quinta-feira, 11 de Junho" usando horário de Brasília. */
export function formatLongDateBR(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
