import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Token do Asaas é obrigatório' 
    });
  }

  try {
    // Teste 1: Validação do Token
    const meResponse = await fetch('https://www.asaas.com/api/v3/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access_token': token,
      },
    });

    if (!meResponse.ok) {
      let errorData;
      try {
        errorData = await meResponse.json();
      } catch {
        errorData = { message: 'Erro de autenticação' };
      }
      return res.status(400).json({
        success: false,
        error: 'Token inválido',
        details: errorData
      });
    }

    const accountData = await meResponse.json();

    // Teste 2: Criação de Link de Pagamento de Teste
    const testPayload = {
      name: 'Teste de Validação - Venha Vender',
      description: 'Link de teste para validação da integração',
      value: 1.00
    };

    const paymentLinkResponse = await fetch('https://www.asaas.com/api/v3/paymentLinks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access_token': token,
      },
      body: JSON.stringify(testPayload)
    });

    if (!paymentLinkResponse.ok) {
      let errorData;
      try {
        errorData = await paymentLinkResponse.json();
      } catch {
        errorData = { message: 'Erro na criação do link de pagamento' };
      }
      return res.status(400).json({
        success: false,
        error: 'Falha na criação de link de pagamento',
        details: errorData
      });
    }

    const paymentLinkData = await paymentLinkResponse.json();

    // Retorna sucesso com informações da conta
    return res.status(200).json({
      success: true,
      message: 'Integração com Asaas validada com sucesso',
      account: {
        name: accountData.name,
        email: accountData.email,
        cpfCnpj: accountData.cpfCnpj,
        environment: accountData.environment
      },
      testPaymentLink: {
        id: paymentLinkData.id,
        url: paymentLinkData.url || paymentLinkData.shortUrl,
        value: paymentLinkData.value
      }
    });

  } catch (error: any) {
    console.error('Erro na validação do Asaas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message || 'Erro desconhecido'
    });
  }
}
