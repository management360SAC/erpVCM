export async function listPayments(page=0, size=20) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/billing/payments?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createPaymentMultipart(payload: {
  invoiceId: number; amount: number; method?: string; refCode?: string; notes?: string; file?: File | null;
}) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify({
    invoiceId: payload.invoiceId,
    amount: payload.amount,
    method: payload.method || "TRANSFERENCIA",
    refCode: payload.refCode || "",
    notes: payload.notes || ""
  })], { type: "application/json" }));
  if (payload.file) fd.append("file", payload.file);
  const res = await fetch(`/api/billing/payments`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function paymentFileUrl(id: number) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  // Si tu backend no exige token en /file puedes omitirlo
  return `/api/billing/payments/${id}/file?auth=${encodeURIComponent(token || "")}`;
}
