// netlify/functions/create-asaas-customer.ts
import { Handler } from '@netlify/functions';

const ASAAS_API_URL_CUSTOMERS = 'https://sandbox.asaas.com/api/v3/customers';
const ASAAS_API_URL_PAYMENTS = 'https://sandbox.asaas.com/api/v3/payments';

const handler: Handler = async (event) => {
  console.log('Requisição recebida:', { method: event.httpMethod, body: event.body });

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido. Use POST.' }) };
  }

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição vazio.' }) };
  }

  try {
    let body;
    try {
      console.log('Tentando parsear body:', event.body);
      body = JSON.parse(event.body);
    } catch (parseErr) {
      console.error('Erro ao parsear body:', parseErr.message, 'Body recebido:', event.body);
      return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição não é JSON válido', details: parseErr.message }) };
    }

    console.log('Dados parseados do frontend:', body);

    const { customer_name: name, customer_email: email, customer_cpf: cpfCnpj, customer_phone: phone } = body;
    const { price, payment_method } = body;

    if (!name || !email || !cpfCnpj) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Nome, email e CPF/CNPJ são obrigatórios.' }) };
    }

    if (!price || payment_method !== 'PIX') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Preço e método de pagamento PIX são obrigatórios.' }) };
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
    console.log('Dados enviados ao Asaas para criar cliente:', asaasCustomerData);

    const customerResponse = await fetch(ASAAS_API_URL_CUSTOMERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(asaasCustomerData),
    });

    const customerData = await customerResponse.json();
    console.log('Resposta do Asaas (cliente):', customerData);

    if (!customerResponse.ok) {
      return { statusCode: customerResponse.status, body: JSON.stringify({ error: 'Erro ao criar cliente no Asaas', details: customerData }) };
    }

    const asaasPaymentData = {
      customer: customerData.id,
      billingType: 'PIX',
      value: parseFloat(price),
      dueDate: new Date().toISOString().split('T')[0],
      description: body.product_name || 'Assinatura Anual - CineFlick Card',
    };
    console.log('Dados enviados ao Asaas para criar pagamento:', asaasPaymentData);

    const paymentResponse = await fetch(ASAAS_API_URL_PAYMENTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(asaasPaymentData),
    });

    const paymentData = await paymentResponse.json();
    console.log('Resposta do Asaas (pagamento):', paymentData);

    if (!paymentResponse.ok) {
      return { statusCode: paymentResponse.status, body: JSON.stringify({ error: 'Erro ao criar pagamento no Asaas', details: paymentData }) };
    }

    return { statusCode: 200, body: JSON.stringify(paymentData) };
  } catch (err) {
    console.error('Erro ao processar requisição:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao criar pagamento', details: err.message }) };
  }
};

export { handler };