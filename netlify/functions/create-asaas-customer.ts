// netlify/functions/create-asaas-customer.ts
import { Handler } from '@netlify/functions';

const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3/customers';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido. Use POST.' }) };
  }

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição vazio.' }) };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('Dados recebidos do frontend:', body);

    const { name, email, cpfCnpj, phone } = body;
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
    console.log('Dados enviados ao Asaas:', asaasCustomerData);

    const response = await fetch(ASAAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(asaasCustomerData),
    });

    const data = await response.json();
    console.log('Resposta do Asaas:', data);

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: 'Erro ao criar cliente no Asaas', details: data }) };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Erro ao processar requisição:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao criar cliente', details: err.message }) };
  }
};

export { handler };