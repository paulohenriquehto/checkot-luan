import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente (se existir arquivo .env)
const loadEnv = () => {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
};

loadEnv();

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// Configurações do Vizzion Pay
const VIZZION_CONFIG = {
    publicKey: process.env.VIZZION_PUBLIC_KEY || '',
    secretKey: process.env.VIZZION_SECRET_KEY || '',
    accountId: process.env.VIZZION_ACCOUNT_ID || '',
    apiUrl: process.env.VIZZION_API_URL || 'https://app.vizzionpay.com/api/v1'
};

// Mapa de tipos MIME
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.webp': 'image/webp',
    '.web': 'image/webp'
};

// Função para criar cobrança PIX no Vizzion Pay
async function createPixPayment(data) {
    // MODO DE DEMONSTRAÇÃO
    if (process.env.DEMO_MODE === 'true') {
        console.log('🎭 MODO DEMONSTRAÇÃO ATIVADO - Retornando dados simulados');

        // Simula delay da API
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            id: `demo_${Date.now()}`,
            status: 'PENDING',
            amount: data.amount,
            qrCode: '00020126580014br.gov.bcb.pix0136demo-qrcode-manual-milhao5204000053039865802BR5925Manual do Milhao6014SAO PAULO62070503***63041234',
            qrCodeImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+TU9ETyBERU1PTlNUUkHDh8ODTzwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjcwJSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Q29uZmlndXJlIGFzIGNyZWRlbmNpYWlzIHbDoWxpZGFzPC90ZXh0Pjwvc3ZnPg==',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            pixKey: 'demo@vizzionpay.com',
            demo: true,
            message: '⚠️ Este é um QR Code de DEMONSTRAÇÃO. Configure as credenciais corretas do Vizzion Pay para gerar cobranças reais.'
        };
    }

    // Formato 1: Padrão original
    const requestData1 = {
        account_id: VIZZION_CONFIG.accountId,
        amount: data.amount,
        customer: {
            name: data.name,
            email: data.email,
            document: data.document,
            phone: data.phone
        },
        description: data.description || 'Manual Do Milhão',
        payment_method: 'pix'
    };

    // Formato 2: Com identifier e client (baseado na documentação)
    const requestData2 = {
        identifier: `order_${Date.now()}`,
        amount: data.amount,
        client: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            document: data.document
        },
        products: [
            {
                id: `product_${Date.now()}`,
                name: data.description || 'Manual Do Milhão',
                quantity: 1,
                price: data.amount
            }
        ],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metadata: {
            source: 'checkout_web',
            product: 'truque_sal_rosa'
        },
        callbackUrl: process.env.SITE_URL ? `${process.env.SITE_URL}/webhook/pix` : undefined
    };

    // Formato 3: Com owner (parece ser para enviar, mas vamos tentar)
    const requestData3 = {
        clientIdentifier: `client_${Date.now()}`,
        callbackUrl: process.env.SITE_URL ? `${process.env.SITE_URL}/webhook/pix` : undefined,
        amount: data.amount,
        owner: {
            ip: '127.0.0.1',
            name: data.name,
            document: {
                type: data.document.length === 11 ? 'cpf' : 'cnpj',
                number: data.document
            }
        }
    };

    try {
        console.log('Tentando criar pagamento PIX...');

        // URL correta baseada no index.js
        const apiUrl = `${VIZZION_CONFIG.apiUrl}/gateway/pix/receive`;

        // Lista de formatos de dados para tentar
        const dataFormats = [
            { name: 'Formato 1 (account_id + customer)', data: requestData1 },
            { name: 'Formato 2 (identifier + client)', data: requestData2 },
            { name: 'Formato 3 (owner)', data: requestData3 }
        ];

        let lastError = null;
        let response = null;

        // Tenta cada combinação de endpoint + formato
        for (const endpoint of endpoints) {
            for (const format of dataFormats) {
                const apiUrl = `${VIZZION_CONFIG.apiUrl}${endpoint}`;
                console.log(`\n📍 Tentando: ${endpoint} com ${format.name}`);
                console.log('URL:', apiUrl);
                console.log('Dados:', JSON.stringify(format.data, null, 2));

                try {
                    // Tenta múltiplas formas de autenticação
                    const authVariants = [
                        // Tentativa 1: x-public-key e x-secret-key (formato correto!)
                        {
                            'Content-Type': 'application/json',
                            'x-public-key': VIZZION_CONFIG.publicKey,
                            'x-secret-key': VIZZION_CONFIG.secretKey
                        },
                        // Tentativa 2: Bearer + Secret Key
                        {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${VIZZION_CONFIG.secretKey}`
                        },
                        // Tentativa 3: Bearer + Public Key
                        {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${VIZZION_CONFIG.publicKey}`
                        },
                        // Tentativa 4: x-api-key
                        {
                            'Content-Type': 'application/json',
                            'x-api-key': VIZZION_CONFIG.secretKey
                        },
                        // Tentativa 5: Account + Secret no header
                        {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${VIZZION_CONFIG.secretKey}`,
                            'x-account-id': VIZZION_CONFIG.accountId
                        }
                    ];

                    for (const [authIndex, headers] of authVariants.entries()) {
                        console.log(`  Tentativa de autenticação ${authIndex + 1}/${authVariants.length}`);
                        console.log('  Headers enviados:', JSON.stringify(headers, null, 4));

                        response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify(format.data)
                        });

                        console.log(`  Status:`, response.status);

                        // Se não for 403 ou 401, encontrou a autenticação correta
                        if (response.status !== 403 && response.status !== 401) {
                            console.log('  ✅ Autenticação aceita!');
                            break;
                        }
                    }

                    // Se não for 404, sai do loop (encontrou o endpoint)
                    if (response.status !== 404) {
                        console.log('✅ Endpoint encontrado!');
                        break;
                    }
                } catch (error) {
                    console.log('❌ Erro:', error.message);
                    lastError = error;
                }
            }

            // Se encontrou um endpoint que não retorna 404, para de tentar
            if (response && response.status !== 404) {
                break;
            }
        }

        if (!response || response.status === 404) {
            throw new Error('Nenhum endpoint funcionou. Todos retornaram 404.');
        }

        const responseText = await response.text();
        console.log('Resposta completa:', responseText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }

            console.error('\n⚠️ ERRO NA API:');
            console.error('Status:', response.status);
            console.error('Mensagem:', errorData.message || 'Unknown error');

            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            result = { raw: responseText };
        }

        // Log para debug (remova em produção)
        console.log('Resposta Vizzion Pay:', JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error);
        throw error;
    }
}

// Handler de requisições
const server = http.createServer(async (req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // API endpoint para criar PIX
    if (req.url === '/api/create-pix' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);

                // Valida dados
                if (!data.name || !data.email || !data.document || !data.phone) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Dados incompletos',
                        message: 'Nome, email, CPF/CNPJ e telefone são obrigatórios'
                    }));
                    return;
                }

                // Verifica se as chaves estão configuradas
                if (!VIZZION_CONFIG.secretKey || !VIZZION_CONFIG.publicKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Configuração incompleta',
                        message: 'Configure as chaves do Vizzion Pay no arquivo .env'
                    }));
                    return;
                }

                // Adiciona valor do produto (TESTE com 15 reais)
                data.amount = 15.00;

                // Cria pagamento PIX
                const pixPayment = await createPixPayment(data);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: pixPayment
                }));

            } catch (error) {
                console.error('Erro:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Erro ao processar pagamento',
                    message: error.message
                }));
            }
        });
        return;
    }

    // Serve arquivos estáticos
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>404 - Não Encontrado</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background: #1a1a1a;
                                color: #fff;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                text-align: center;
                            }
                            .error-container {
                                max-width: 500px;
                                padding: 2rem;
                            }
                            h1 {
                                font-size: 5rem;
                                margin: 0;
                                color: #1E88E5;
                            }
                            p {
                                font-size: 1.2rem;
                                margin: 1rem 0;
                            }
                            a {
                                color: #1E88E5;
                                text-decoration: none;
                                font-weight: bold;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="error-container">
                            <h1>404</h1>
                            <p>Página não encontrada</p>
                            <p><a href="/">← Voltar para o início</a></p>
                        </div>
                    </body>
                    </html>
                `, 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Erro no servidor: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║                                                ║');
    console.log('║   ✅  Servidor rodando com sucesso!           ║');
    console.log('║                                                ║');
    console.log(`║   🌐  URL: http://${HOST}:${PORT}/              ║`);
    console.log('║                                                ║');
    if (!VIZZION_CONFIG.secretKey || !VIZZION_CONFIG.publicKey) {
        console.log('║   ⚠️  ATENÇÃO: Configure o arquivo .env      ║');
        console.log('║      com suas chaves do Vizzion Pay!         ║');
    } else {
        console.log('║   ✅  Credenciais Vizzion configuradas       ║');
        console.log('║   💰  Valor de teste: R$ 15,00               ║');
    }
    console.log('║                                                ║');
    console.log('║   💡 Pressione Ctrl+C para parar o servidor   ║');
    console.log('║                                                ║');
    console.log('╚════════════════════════════════════════════════╝\n');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: Porta ${PORT} já está em uso!`);
        console.error('💡 Tente fechar o processo que está usando a porta ou use outra porta.\n');
    } else {
        console.error(`\n❌ Erro no servidor: ${error.message}\n`);
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n\n👋 Encerrando servidor...\n');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso!\n');
        process.exit(0);
    });
});
