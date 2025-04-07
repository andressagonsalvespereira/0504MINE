import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ASAAS_API_URL_CUSTOMERS = 'https://sandbox.asaas.com/api/v3/customers';
const ASAAS_API_URL_PAYMENTS = 'https://sandbox.asaas.com/api/v3/payments';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Use POST.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    const {
      customer_name: name,
      customer_email: email,
      customer_cpf: cpfCnpj,
      customer_phone: phone,
      price,
      payment_method,
      product_name,
      order_id = null,
    } = body;

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) throw new Error('API key não configurada');

    const cleanCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');

    const customerRes = await fetch(ASAAS_API_URL_CUSTOMERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name,
        email,
        cpfCnpj: cleanCpfCnpj,
        mobilePhone: phone?.replace(/[^\d]/g, ''),
      }),
    });

    const customerData = await customerRes.json();
    if (!customerRes.ok) {
      return {
        statusCode: customerRes.status,
        body: JSON.stringify({ error: 'Erro ao criar cliente', details: customerData }),
      };
    }

    const paymentRes = await fetch(ASAAS_API_URL_PAYMENTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: payment_method,
        value: parseFloat(price),
        dueDate: new Date().toISOString().split('T')[0],
        description: product_name,
      }),
    });

    const paymentData = await paymentRes.json();
    if (!paymentRes.ok) {
      return {
        statusCode: paymentRes.status,
        body: JSON.stringify({ error: 'Erro ao criar pagamento', details: paymentData }),
      };
    }

    const qrCodeResponse = await fetch(`${ASAAS_API_URL_PAYMENTS}/${paymentData.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    const qrCodeData = qrCodeResponse.ok
      ? await qrCodeResponse.json()
      : { payload: null, qrCodeImage: null };

    const insert = await supabase.from('asaas_payments').insert({
      payment_id: paymentData.id,
      order_id,
      status: paymentData.status,
      amount: paymentData.value,
      method: paymentData.billingType,
      qr_code: qrCodeData.payload,
      qr_code_image: qrCodeData.qrCodeImage,
      created_at: new Date().toISOString(),
    });

    if (insert.error) {
      console.error('Erro ao salvar cobrança:', insert.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao salvar cobrança', details: insert.error.message }),
      };
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
    console.error('Erro geral:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno', details: err.message }),
    };
  }
};

export { handler };
