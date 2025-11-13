# ⚠️ IMPORTANTE: Configuração da API do Vizzion Pay

## Problema Atual

O checkout está funcionando perfeitamente, mas **não conseguimos encontrar o endpoint correto** da API do Vizzion Pay para criar pagamentos PIX.

### Endpoints Tentados (todos retornaram 404):
1. `https://app.vizzionpay.com/api/v1/charges`
2. `https://app.vizzionpay.com/api/v1/payment`
3. `https://app.vizzionpay.com/api/v1/payments`
4. `https://app.vizzionpay.com/api/v1/transactions`

## Como Resolver

### Opção 1: Acessar a Documentação
1. Acesse https://app.vizzionpay.com/docs
2. Faça login com sua conta
3. Procure por:
   - "Criar Pagamento PIX"
   - "Create PIX Payment"
   - "API Reference" > "Payments"
4. Anote o endpoint correto (ex: `POST /api/v1/pix/create`)

### Opção 2: Verificar no Painel do Vizzion Pay
1. Acesse https://app.vizzionpay.com/
2. Entre na sua conta
3. Vá em "Documentação" ou "API"
4. Copie o exemplo de código para criar PIX
5. Identifique o endpoint usado

### Opção 3: Suporte Técnico
Entre em contato com o suporte do Vizzion Pay e pergunte:
> "Qual é o endpoint correto da API REST para criar uma cobrança PIX?
> Estou usando a URL base: https://app.vizzionpay.com/api/v1"

## Como Atualizar o Código

Depois de descobrir o endpoint correto, edite o arquivo `server-api.js`:

### Localização: linha 75

```javascript
// ALTERE ESTA LINHA:
let apiEndpoint = `${VIZZION_CONFIG.apiUrl}/charges`;

// PARA O ENDPOINT CORRETO, EXEMPLO:
let apiEndpoint = `${VIZZION_CONFIG.apiUrl}/pix/create`;
// ou
let apiEndpoint = `${VIZZION_CONFIG.apiUrl}/invoices`;
// ou qualquer que seja o endpoint correto
```

## Estrutura de Dados Atual

Estamos enviando os seguintes dados:

```json
{
  "account_id": "cmf2sj7vn0jpckxxa3u31r7pc",
  "amount": 37,
  "customer": {
    "name": "Nome do Cliente",
    "email": "email@cliente.com",
    "document": "09915415966",
    "phone": "44999454504"
  },
  "description": "Truque do Sal Rosa",
  "payment_method": "pix"
}
```

**Verifique se a estrutura está correta** segundo a documentação do Vizzion Pay.
Pode ser necessário ajustar os nomes dos campos.

## Outras Possíveis Causas

1. **Versão da API errada**: Talvez seja `/api/v2/` ao invés de `/api/v1/`
2. **URL base diferente**: Talvez seja `https://api.vizzionpay.com` ao invés de `https://app.vizzionpay.com/api`
3. **Autenticação incorreta**: Verifique se o formato do Bearer token está correto
4. **Campos obrigatórios faltando**: Talvez precise adicionar mais campos na requisição

## Logs Disponíveis

Quando você testa o checkout, todos os logs aparecem no terminal onde o servidor está rodando.
Isso ajuda a debugar o que está acontecendo.

---

**Status**: ⏳ Aguardando informações da documentação oficial do Vizzion Pay
**Última tentativa**: 30/10/2025 às 16:06
