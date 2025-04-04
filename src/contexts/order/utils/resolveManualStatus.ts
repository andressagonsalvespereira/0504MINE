/**
 * Tipos possíveis de status manual normalizado
 */
export type ManualStatus = "PENDING" | "CONFIRMED" | "REJECTED";

/**
 * Normaliza status de pagamento manual para valores padrão suportados pelo sistema
 * @param status Status original do pagamento (pode ser qualquer string)
 * @returns Status normalizado: "PENDING", "CONFIRMED" ou "REJECTED"
 */
export const resolveManualStatus = (
  status: string | undefined | null
): ManualStatus => {
  if (!status) return "PENDING";

  const normalizedStatus = status.toUpperCase();

  if (
    [
      "CONFIRMED",
      "APPROVED",
      "PAID",
      "APROVADO",
      "PAGO",
      "COMPLETED",
      "SUCCESS",
    ].includes(normalizedStatus)
  ) {
    return "CONFIRMED";
  }

  if (
    [
      "REJECTED",
      "DENIED",
      "FAILED",
      "RECUSADO",
      "NEGADO",
      "CANCELADO",
      "DECLINED",
    ].includes(normalizedStatus)
  ) {
    return "REJECTED";
  }

  return "PENDING";
};

/**
 * Verifica se um status é considerado rejeitado/recusado
 */
export const isRejectedStatus = (status: string | undefined | null): boolean =>
  resolveManualStatus(status) === "REJECTED";

/**
 * Verifica se um status é considerado confirmado/aprovado
 */
export const isConfirmedStatus = (status: string | undefined | null): boolean =>
  resolveManualStatus(status) === "CONFIRMED";

/**
 * Verifica se um status é considerado pendente/em análise
 */
export const isPendingStatus = (status: string | undefined | null): boolean =>
  resolveManualStatus(status) === "PENDING";
