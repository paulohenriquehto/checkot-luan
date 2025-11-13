const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { nome, email, telefone, cpf, amount } = body;
  if (!nome || !email || !telefone || !cpf || !amount) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Todos os campos são obrigatórios.' })
    };
  }

  const VIZZION_PUBLIC_KEY = process.env.VIZZION_PUBLIC_KEY;
  const VIZZION_SECRET_KEY = process.env.VIZZION_SECRET_KEY;
  const VIZZION_ACCOUNT_ID = process.env.VIZZION_ACCOUNT_ID;
  const VIZZION_API_URL = process.env.VIZZION_API_URL || 'https://app.vizzionpay.com/api/v1';

  if (!VIZZION_PUBLIC_KEY || !VIZZION_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Credenciais Vizzion não configuradas.' })
    };
  }

  const sanitizedPhone = String(telefone).replace(/\D/g, '');
  const sanitizedCpf = String(cpf).replace(/\D/g, '');
  const finalAmount = parseFloat(amount);
  const txId = `txid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const requestFormats = [
    {
      name: 'Formato 1',
      url: `${VIZZION_API_URL}/gateway/pix/receive`,
      data: {
        identifier: txId,
        amount: finalAmount,
        client: { name: nome, email, phone: sanitizedPhone, document: sanitizedCpf },
        description: `Pagamento PIX para ${nome}`
      },
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': VIZZION_PUBLIC_KEY,
        'x-secret-key': VIZZION_SECRET_KEY
      }
    },
    {
      name: 'Formato 2',
      url: `${VIZZION_API_URL}/pix/charge`,
      data: {
        account_id: VIZZION_ACCOUNT_ID,
        amount: finalAmount,
        customer: { name: nome, email, phone: sanitizedPhone, document: sanitizedCpf },
        description: `Manual Do Milhão - ${txId}`
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIZZION_SECRET_KEY}`
      }
    },
    {
      name: 'Formato 3',
      url: `${VIZZION_API_URL}/gateway/pix/receive`,
      data: {
        identifier: txId,
        amount: finalAmount,
        client: { name: nome, email, phone: sanitizedPhone, document: sanitizedCpf },
        description: `Pagamento PIX para ${nome}`
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Public-Key': VIZZION_PUBLIC_KEY,
        'X-Secret-Key': VIZZION_SECRET_KEY
      }
    }
  ];

  let lastError = null;
  for (const format of requestFormats) {
    try {
      const resp = await axios.post(format.url, format.data, { headers: format.headers, timeout: 10000 });

      let qrCodeBase64, qrCodeText, transactionId;
      const d = resp.data;
      if (d?.pix?.base64) {
        qrCodeBase64 = d.pix.base64;
        qrCodeText = d.pix.code || d.pix.qr_code_text || d.pix.copy_and_paste;
        transactionId = d.transactionId || d.id || txId;
      } else if (d?.qr_code) {
        qrCodeBase64 = d.qr_code.base64 || d.qr_code;
        qrCodeText = d.qr_code_text || d.copy_and_paste;
        transactionId = d.id || d.charge_id || txId;
      } else if (d?.base64) {
        qrCodeBase64 = d.base64;
        qrCodeText = d.qr_code || d.code;
        transactionId = d.id || txId;
      }

      if (qrCodeBase64 && qrCodeText) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { qrCodeBase64, qrCodeText, transactionId }, debug: { format: format.name, fullResponse: d } })
        };
      }

    } catch (err) {
      lastError = err;
    }
  }

  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Erro ao gerar o PIX.', details: lastError?.response?.data || lastError?.message || 'unknown' })
  };
};
