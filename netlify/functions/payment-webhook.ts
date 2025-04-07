import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../src/utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Corpo da requisição vazio.' }),
      };
    }

    const body = JSON.parse(event.body);
    logger.log('Webhook recebido do Asaas:', body);

    const { event: eventType, payment } = body;

    if (eventType === 'payment.received') {
      const paymentId = payment.id;
      const status = payment.status; // geralmente "RECEIVED"

      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: status }) // ou 'status' se for esse o campo correto
        .eq('asaas_payment_id', paymentId) // substitua se o campo no Supabase for diferente
        .select()
        .single();

      if (error) {
        logger.error('Erro ao atualizar pedido no Supabase:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Erro ao atualizar pedido.' }),
        };
      }

      logger.log('Pedido atualizado com sucesso:', data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Webhook processado com sucesso.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Evento ignorado.' }),
    };
  } catch (error) {
    logger.error('Erro ao processar webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao processar webhook.' }),
    };
  }
};

export { handler };
