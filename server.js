import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = 'localhost';

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
    '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // Define o caminho do arquivo
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Obtém a extensão do arquivo
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Lê e serve o arquivo
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Arquivo não encontrado
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
                // Erro no servidor
                res.writeHead(500);
                res.end(`Erro no servidor: ${error.code}`, 'utf-8');
            }
        } else {
            // Sucesso - serve o arquivo
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
    console.log('║   💡 Pressione Ctrl+C para parar o servidor   ║');
    console.log('║                                                ║');
    console.log('╚════════════════════════════════════════════════╝\n');
});

// Tratamento de erros
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: Porta ${PORT} já está em uso!`);
        console.error('💡 Tente fechar o processo que está usando a porta ou use outra porta.\n');
    } else {
        console.error(`\n❌ Erro no servidor: ${error.message}\n`);
    }
    process.exit(1);
});

// Encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n\n👋 Encerrando servidor...\n');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso!\n');
        process.exit(0);
    });
});
