import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ASAAS_API_URL_CUSTOMERS = 'https://sandbox.asaas.com/api/v3/customers';
const ASAAS_API_URL_PAYMENTS = 'https://sandbox.asaas.com/api/v3/payments';

const handler: Handler = async (event) => {
  console.log('[Netlify] Requisição recebida:', { method: event.httpMethod, body: event.body });

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido. Use POST.' }) };
  }

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição vazio.' }) };
  }

  try {
    const body = JSON.parse(event.body);

    const {
      customer_name: name,
      customer_email: email,
      customer_cpf: cpfCnpj,
      customer_phone: phone,
      price = 19.9,
      payment_method = 'PIX',
      product_name = 'Produto sem nome',
      order_id = null
    } = body;

    if (!name || !email || !cpfCnpj) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Nome, email e CPF/CNPJ são obrigatórios.' }) };
    }

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key não configurada.' }) };
    }

    const cleanCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      return { statusCode: 400, body: JSON.stringify({ error: 'CPF ou CNPJ inválido.' }) };
    }

    const asaasCustomerData = {
      name,
      email,
      cpfCnpj: cleanCpfCnpj,
      mobilePhone: phone ? phone.replace(/[^\d]/g, '') : undefined,
    };

    const customerResponse = await fetch(ASAAS_API_URL_CUSTOMERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(asaasCustomerData),
    });

    const customerData = await customerResponse.json();
    if (!customerResponse.ok) {
      return {
        statusCode: customerResponse.status,
        body: JSON.stringify({ error: 'Erro ao criar cliente no Asaas', details: customerData }),
      };
    }

    const asaasPaymentData = {
      customer: customerData.id,
      billingType: payment_method,
      value: parseFloat(price),
      dueDate: new Date().toISOString().split('T')[0],
      description: product_name,
    };

    const paymentResponse = await fetch(ASAAS_API_URL_PAYMENTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(asaasPaymentData),
    });

    const paymentData = await paymentResponse.json();
    if (!paymentResponse.ok) {
      return {
        statusCode: paymentResponse.status,
        body: JSON.stringify({ error: 'Erro ao criar pagamento no Asaas', details: paymentData }),
      };
    }

    let qrCodeData = { payload: 'QR_CODE_NOT_AVAILABLE', qrCodeImage: null };
    if (paymentData.id) {
      const qrCodeResponse = await fetch(`${ASAAS_API_URL_PAYMENTS}/${paymentData.id}/pixQrCode`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
        },
      });

      if (qrCodeResponse.ok) {
        qrCodeData = await qrCodeResponse.json();
      }
    }

    let orderIdToSave = order_id;
    if (order_id) {
      const { data: orderCheck } = await supabase
        .from('orders')
        .select('id')
        .eq('id', order_id)
        .single();

      if (!orderCheck) {
        console.warn('[Netlify] ⚠️ Pedido não encontrado, salvando cobrança sem order_id');
        orderIdToSave = null;
      }
    }

    const insert = await supabase.from('asaas_payments').insert({
      payment_id: paymentData.id,
      order_id: orderIdToSave,
      status: paymentData.status,
      amount: paymentData.value,
      method: paymentData.billingType,
      qr_code: qrCodeData.payload || null,
      qr_code_image: qrCodeData.qrCodeImage || null,
      created_at: new Date().toISOString(),
    });

    if (insert.error) {
      console.error('[Netlify] ❌ Erro ao salvar cobrança no Supabase:', insert.error.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...paymentData,
        pix: {
          payload: qrCodeData.payload,
          qrCodeImage: qrCodeData.qrCodeImage,
        },
      }),
    };
  } catch (err: any) {
    console.error('[Netlify] ❌ Erro geral:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao criar pagamento', details: err.message }),
    };
  }
};

export { handler };
