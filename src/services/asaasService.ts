import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const BASE_URL = 'https://www.asaas.com/api/v3';

// === API Service ===
export async function asaasGet(endpoint: string) {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.json();
}

export async function asaasPost(endpoint: string, body: any) {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.errors?.[0]?.description || result.message || 'Erro desconhecido na API Asaas');
  }
  return result;
}

// === Config Service ===
export function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_ASAAS_API_KEY || process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error('Chave da API do Asaas não configurada');
  }
  return key;
}

// === Payment Service ===
export async function criarCobrancaPix(data: any, orderId?: number) {
  logger.log('[asaasService] Criando cobrança PIX no Asaas...');

  const result = await asaasPost('payments', data);

  // Salvar no Supabase para uso posterior com polling
  const insertResult = await supabase.from('asaas_payments').insert({
    payment_id: result.id,
    order_id: orderId ?? null,
    qr_code: result.pixQrCode || null,
    qr_code_image: result.pixQrCodeImage || null,
    status: result.status || null,
    amount: result.value,
    method: result.billingType || 'PIX',
    created_at: new Date().toISOString(),
  });

  if (insertResult.error) {
    logger.error('[asaasService] ❌ Erro ao salvar cobrança PIX no Supabase:', insertResult.error);
  } else {
    logger.log('[asaasService] ✅ Cobrança PIX salva no Supabase com sucesso');
  }

  return result;
}

export async function cancelarCobranca(id: string) {
  logger.log('[asaasService] Cancelando cobrança PIX...');
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}/payments/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.errors?.[0]?.description || result.message || 'Erro ao cancelar cobrança');
  }
  return result;
}

// === Settings Service ===
export async function getAsaasSettings() {
  const { data, error } = await supabase.from('asaas_config').select('*').single();
  if (error) {
    throw new Error('Erro ao buscar configurações Asaas: ' + error.message);
  }
  return data;
}
