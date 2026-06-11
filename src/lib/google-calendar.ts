import { google } from "googleapis";
import { startOfTodayBR, endOfTodayBR } from "./date";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export function parseEventTitle(title: string): { clientName: string; serviceType: string } {
  // Formato esperado: "João Silva - Massagem Relaxante"
  const parts = title.split(" - ");
  return {
    clientName: parts[0]?.trim() ?? title.trim(),
    serviceType: parts[1]?.trim() ?? "Massagem",
  };
}

export async function listUpcomingEvents(daysAhead = 30) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}

export async function listTodayEvents() {
  const start = startOfTodayBR();
  const end = endOfTodayBR();

  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}

export async function listTomorrowEvents() {
  const start = new Date(startOfTodayBR().getTime() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}
