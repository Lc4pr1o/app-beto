import axios from "axios";

const mp = axios.create({
  baseURL: "https://api.mercadopago.com",
  headers: {
    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

export async function createPixCharge(params: {
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  externalReference: string;
}) {
  const res = await mp.post("/v1/payments", {
    transaction_amount: params.amount,
    description: params.description,
    payment_method_id: "pix",
    payer: {
      email: params.clientEmail || "cliente@semEmail.com",
      first_name: params.clientName.split(" ")[0],
      last_name: params.clientName.split(" ").slice(1).join(" ") || "-",
    },
    external_reference: params.externalReference,
  });

  const data = res.data;
  return {
    paymentId: data.id as string,
    pixCode: data.point_of_interaction?.transaction_data?.qr_code as string,
    pixQrCode: data.point_of_interaction?.transaction_data?.qr_code_base64 as string,
    status: data.status as string,
  };
}
