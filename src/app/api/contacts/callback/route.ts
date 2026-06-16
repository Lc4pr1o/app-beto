import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/clientes?error=google_auth_cancelled`);
  }

  const redirectUri = `${origin}/api/contacts/callback`;

  // Trocar code por access_token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/clientes?error=token_exchange_failed`);
  }

  const { access_token } = await tokenRes.json();

  // Salvar token em cookie httpOnly (10 min)
  const response = NextResponse.redirect(`${origin}/clientes/importar`);
  response.cookies.set("gcal_contact_token", access_token, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}
