# checkot-luan

## Checkout Sal Rosa - Integração Vizzion Pay

Checkout completo com integração PIX via Vizzion Pay.

## 🔒 Configuração Segura

### 1. Criar arquivo `.env`

Copie o arquivo `.env.example` e renomeie para `.env`:

```bash
cp .env.example .env
```

### 2. Adicionar suas chaves do Vizzion Pay

Edite o arquivo `.env` e adicione suas credenciais:

```env
VIZZION_PUBLIC_KEY=sua_chave_publica_aqui
VIZZION_PRIVATE_KEY=sua_chave_privada_aqui
VIZZION_API_URL=https://api.vizzionpay.com
PORT=3000
```

⚠️ **IMPORTANTE:**
- NUNCA commite o arquivo `.env` no git
- O `.env` já está no `.gitignore`
- Mantenha suas chaves em segredo

### 3. Instalar dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
node server-api.js
```

Ou para desenvolvimento com reload automático:

```bash
npm run dev
```

O servidor estará disponível em: http://localhost:3000

## 📋 Funcionalidades

✅ Validação completa de formulário
✅ Máscaras automáticas (CPF/CNPJ, Telefone)
✅ Integração PIX com Vizzion Pay
✅ QR Code dinâmico
✅ Código PIX Copia e Cola
✅ Validação em tempo real
✅ Design responsivo

## 🔐 Segurança

- Chaves armazenadas em variáveis de ambiente
- API privada no backend
- Validações server-side e client-side
- HTTPS recomendado em produção

## 📁 Estrutura

```
checkout-sal-rosa/
├── index.html          # Frontend do checkout
├── styles.css          # Estilos
├── script.js           # JavaScript do frontend
├── server-api.js       # Backend com API PIX
├── .env.example        # Exemplo de configuração
├── .env                # Suas chaves (NÃO COMMITTAR)
├── .gitignore          # Arquivos ignorados
└── README.md           # Este arquivo
```

## 🚀 Deploy em Produção

1. Configure HTTPS
2. Use variáveis de ambiente do servidor
3. Ative modo produção: `NODE_ENV=production`
4. Configure webhook do Vizzion Pay
5. Teste extensivamente antes de ir ao ar

## 📞 Suporte Vizzion Pay

- Documentação: https://app.vizzionpay.com/docs
- Suporte: contato via painel Vizzion Pay

## ⚠️ Observações

- Este código requer ajustes conforme a documentação exata do Vizzion Pay
- Teste primeiro em ambiente de sandbox
- Valide os webhooks de pagamento confirmado
- Implemente logs de transações
