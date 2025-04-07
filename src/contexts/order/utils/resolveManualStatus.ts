/**
 * Tipos possíveis de status manual normalizado
 */
export type ManualStatus = "PENDING" | "CONFIRMED" | "REJECTED";

/**
 * Normaliza status de pagamento manual para valores padrão suportados pelo sistema
 * @param status Status original do pagamento (qualquer string ou nulo)
 * @returns Status normalizado: "PENDING", "CONFIRMED" ou "REJECTED"
 */
export const resolveManualStatus = (
  status: string | undefined | null
): ManualStatus => {
  console.log("[resolveManualStatus] Recebido status:", status);

  if (!status) {
    console.log("[resolveManualStatus] Status vazio → PENDING");
    return "PENDING";
  }

  const normalizedStatus = status.trim().toUpperCase();
  console.log("[resolveManualStatus] Normalizado para:", normalizedStatus);

  if (
    ["CONFIRMED", "APPROVED", "PAID", "APROVADO", "PAGO", "COMPLETED", "SUCCESS"].includes(normalizedStatus)
  ) {
    console.log("[resolveManualStatus] Reconhecido como CONFIRMED");
    return "CONFIRMED";
  }

  if (
    ["REJECTED", "DENIED", "FAILED", "RECUSADO", "NEGADO", "CANCELADO", "DECLINED", "EXPIRED", "OVERDUE"].includes(normalizedStatus)
  ) {
    console.log("[resolveManualStatus] Reconhecido como REJECTED");
    return "REJECTED";
  }

  console.log("[resolveManualStatus] Não reconhecido → PENDING");
  return "PENDING";
};

/**
 * Verifica se o status representa um pagamento confirmado
 */
export const isConfirmedStatus = (status: string | undefined | null): boolean => {
  const result = resolveManualStatus(status) === "CONFIRMED";
  console.log("[isConfirmedStatus] Status:", status, "→", result);
  return result;
};

/**
 * Verifica se o status representa um pagamento recusado
 */
export const isRejectedStatus = (status: string | undefined | null): boolean => {
  const result = resolveManualStatus(status) === "REJECTED";
  console.log("[isRejectedStatus] Status:", status, "→", result);
  return result;
};

/**
 * Verifica se o status representa um pagamento pendente
 */
export const isPendingStatus = (status: string | undefined | null): boolean => {
  const result = resolveManualStatus(status) === "PENDING";
  console.log("[isPendingStatus] Status:", status, "→", result);
  return result;
};
