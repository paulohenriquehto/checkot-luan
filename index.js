const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const VIZZION_PUBLIC_KEY = process.env.VIZZION_PUBLIC_KEY;
const VIZZION_SECRET_KEY = process.env.VIZZION_SECRET_KEY;
const VIZZION_ACCOUNT_ID = process.env.VIZZION_ACCOUNT_ID;
const VIZZION_API_URL = process.env.VIZZION_API_URL || 'https://app.vizzionpay.com/api/v1';



// Configurações da Kiwify para Cartão de Crédito
const KIWIFY_CLIENT_ID = process.env.KIWIFY_CLIENT_ID;
const KIWIFY_CLIENT_SECRET = process.env.KIWIFY_CLIENT_SECRET;
const KIWIFY_API_URL = process.env.KIWIFY_API_URL || 'https://public-api.kiwify.com/v1';

// Cache do token OAuth da Kiwify
let kiwifyAccessToken = null;
let kiwifyTokenExpiry = null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da raiz do projeto
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Função auxiliar para gerar assinatura HMAC se necessário
function generateSignature(data, secretKey) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');
}

app.post('/generate-pix', async (req, res) => {
    const { nome, email, telefone, cpf, amount } = req.body;

    if (!nome || !email || !telefone || !cpf || !amount) {
        return res.status(400).json({ error: 'Todos os campos (nome, email, telefone, cpf, valor) são obrigatórios.' });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'O valor deve ser um número positivo.' });
    }

    // Validar credenciais
    if (!VIZZION_PUBLIC_KEY || !VIZZION_SECRET_KEY) {
        console.error('❌ Credenciais Vizzion não configuradas!');
        return res.status(500).json({ error: 'Credenciais Vizzion não configuradas no servidor.' });
    }

    const sanitizedPhone = telefone.replace(/[^0-9]/g, '');
    const sanitizedCpf = cpf.replace(/[^0-9]/g, '');
    const finalAmount = parseFloat(amount);
    const txId = `txid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Tenta múltiplos formatos de requisição
    const requestFormats = [
        {
            name: 'Formato 1: Padrão Vizzion (identifier + client)',
            url: `${VIZZION_API_URL}/gateway/pix/receive`,
            data: {
                identifier: txId,
                amount: finalAmount,
                client: {
                    name: nome,
                    email: email,
                    phone: sanitizedPhone,
                    document: sanitizedCpf,
                },
                description: `Pagamento PIX para ${nome}`,
            },
            headers: {
                'Content-Type': 'application/json',
                'x-public-key': VIZZION_PUBLIC_KEY,
                'x-secret-key': VIZZION_SECRET_KEY,
            }
        },
        {
            name: 'Formato 2: Com account_id',
            url: `${VIZZION_API_URL}/pix/charge`,
            data: {
                account_id: VIZZION_ACCOUNT_ID,
                amount: finalAmount,
                customer: {
                    name: nome,
                    email: email,
                    phone: sanitizedPhone,
                    document: sanitizedCpf,
                },
                description: `Manual Do Milhão - ${txId}`,
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VIZZION_SECRET_KEY}`,
            }
        },
        {
            name: 'Formato 3: COM X- Headers (maiúsculas)',
            url: `${VIZZION_API_URL}/gateway/pix/receive`,
            data: {
                identifier: txId,
                amount: finalAmount,
                client: {
                    name: nome,
                    email: email,
                    phone: sanitizedPhone,
                    document: sanitizedCpf,
                },
                description: `Pagamento PIX para ${nome}`,
            },
            headers: {
                'Content-Type': 'application/json',
                'X-Public-Key': VIZZION_PUBLIC_KEY,
                'X-Secret-Key': VIZZION_SECRET_KEY,
            }
        }
    ];

    let lastError = null;
    let success = false;

    for (const format of requestFormats) {
        try {
            console.log(`\n📤 Tentando ${format.name}...`);
            console.log(`URL: ${format.url}`);
            console.log('Headers:', JSON.stringify(format.headers, null, 2));
            console.log('Dados:', JSON.stringify(format.data, null, 2));

            const response = await axios.post(format.url, format.data, {
                headers: format.headers,
                timeout: 10000,
            });

            console.log('✅ Sucesso na requisição!');
            console.log('Status:', response.status);
            console.log('Resposta:', JSON.stringify(response.data, null, 2));

            // Processa resposta em múltiplos formatos possíveis
            let qrCodeBase64, qrCodeText, transactionId;

            if (response.data.pix && response.data.pix.base64) {
                // Formato 1: resposta.pix.base64
                qrCodeBase64 = response.data.pix.base64;
                qrCodeText = response.data.pix.code;
                transactionId = response.data.transactionId || response.data.id || txId;
            } else if (response.data.qr_code) {
                // Formato 2: resposta.qr_code
                qrCodeBase64 = response.data.qr_code.base64 || response.data.qr_code;
                qrCodeText = response.data.qr_code_text || response.data.copy_and_paste;
                transactionId = response.data.id || response.data.charge_id || txId;
            } else if (response.data.base64) {
                // Formato 3: resposta.base64
                qrCodeBase64 = response.data.base64;
                qrCodeText = response.data.qr_code || response.data.code;
                transactionId = response.data.id || txId;
            }

            if (qrCodeBase64 && qrCodeText) {
                console.log('✅ QR Code extraído com sucesso!');
                res.json({
                    data: {
                        qrCodeBase64: qrCodeBase64,
                        qrCodeText: qrCodeText,
                        transactionId: transactionId,
                    },
                    debug: {
                        format: format.name,
                        fullResponse: response.data
                    }
                });
                success = true;
                break;
            }

        } catch (error) {
            console.error(`❌ Erro em ${format.name}:`);
            console.error('Status:', error.response?.status);
            console.error('Mensagem:', error.response?.data || error.message);
            lastError = error;
        }
    }

    if (!success) {
        console.error('\n❌ Todas as tentativas falharam!');
        console.error('Último erro:', lastError?.response?.data || lastError?.message);

        res.status(500).json({
            error: 'Erro ao gerar o PIX após tentar múltiplos formatos.',
            details: lastError?.response?.data || lastError?.message,
            debug: {
                publicKeyConfigured: !!VIZZION_PUBLIC_KEY,
                secretKeyConfigured: !!VIZZION_SECRET_KEY,
                accountIdConfigured: !!VIZZION_ACCOUNT_ID,
            }
        });
    }
});

// Endpoint para verificar status do pagamento
app.post('/check-payment', async (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID é obrigatório.' });
    }

    try {
        console.log('🔍 Verificando status do pagamento:', transactionId);

        // Endpoint para verificar status na Vizzion Pay
        const checkUrl = `${VIZZION_API_URL}/gateway/pix/status/${transactionId}`;

        const response = await axios.get(checkUrl, {
            headers: {
                'Content-Type': 'application/json',
                'X-Public-Key': VIZZION_PUBLIC_KEY,
                'X-Secret-Key': VIZZION_SECRET_KEY,
            },
        });

        console.log('✅ Status recebido:', response.data);

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Erro ao verificar status:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Erro ao verificar status do pagamento.',
            details: error.response ? error.response.data : error.message
        });
    }
});

// Função para obter token de acesso da Kiwify
async function getKiwifyAccessToken() {
    // Verifica se o token ainda é válido
    if (kiwifyAccessToken && kiwifyTokenExpiry && Date.now() < kiwifyTokenExpiry) {
        return kiwifyAccessToken;
    }

    try {
        console.log('🔐 Obtendo token de acesso da Kiwify...');

        const response = await axios.post(`${KIWIFY_API_URL}/oauth/token`,
            new URLSearchParams({
                client_id: KIWIFY_CLIENT_ID,
                client_secret: KIWIFY_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        kiwifyAccessToken = response.data.access_token;
        // Token expira em 24 horas (expires_in: 86400) - colocamos margem de 23 horas
        kiwifyTokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

        console.log('✅ Token de acesso obtido com sucesso');
        console.log('⏰ Token válido até:', new Date(kiwifyTokenExpiry).toLocaleString());
        return kiwifyAccessToken;

    } catch (error) {
        console.error('Erro ao obter token Kiwify:', error.response ? error.response.data : error.message);
        throw new Error('Falha na autenticação com Kiwify');
    }
}

// Endpoint para processar pagamento com cartão via Kiwify
app.post('/process-card', async (req, res) => {
    const { nome, email, cpf, telefone, cardNumber, cardName, cardExpiry, cardCvv, amount } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !email || !cpf || !telefone || !amount) {
        return res.status(400).json({ error: 'Dados do cliente são obrigatórios.' });
    }

    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        return res.status(400).json({ error: 'Dados do cartão são obrigatórios.' });
    }

    try {
        console.log('💳 Processando pagamento com cartão via Kiwify...');

        // Obter token de acesso
        const accessToken = await getKiwifyAccessToken();

        // Preparar dados do pagamento
        const paymentData = {
            amount: parseFloat(amount),
            customer: {
                name: nome,
                email: email,
                document: cpf.replace(/\D/g, ''),
                phone: telefone.replace(/\D/g, '')
            },
            card: {
                number: cardNumber.replace(/\D/g, ''),
                holder_name: cardName,
                exp_month: cardExpiry.substring(0, 2),
                exp_year: '20' + cardExpiry.substring(3, 5),
                cvv: cardCvv
            },
            installments: 1,
            description: 'Manual Do Milhão'
        };

        console.log('📤 Enviando dados para Kiwify...');

        // Fazer requisição para API da Kiwify
        const response = await axios.post(`${KIWIFY_API_URL}/payments`, paymentData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('✅ Resposta da Kiwify:', response.data);

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Erro ao processar pagamento Kiwify:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Erro ao processar pagamento com cartão.',
            details: error.response ? error.response.data : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
