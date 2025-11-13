// Máscaras e Formatações
const masks = {
    cpfCnpj: (value) => {
        value = value.replace(/\D/g, '');
        if (value.length <= 11) {
            // CPF: 000.000.000-00
            return value
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ: 00.000.000/0000-00
            return value
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
    },

    phone: (value) => {
        value = value.replace(/\D/g, '');
        if (value.length <= 10) {
            // (00) 0000-0000
            return value
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            // (00) 00000-0000
            return value
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
    },

    cardNumber: (value) => {
        value = value.replace(/\D/g, '');
        // 0000 0000 0000 0000
        return value
            .replace(/(\d{4})(\d)/, '$1 $2')
            .replace(/(\d{4})(\d)/, '$1 $2')
            .replace(/(\d{4})(\d)/, '$1 $2');
    },

    cardExpiry: (value) => {
        value = value.replace(/\D/g, '');
        // MM/AA
        return value.replace(/(\d{2})(\d)/, '$1/$2');
    },

    cardCvv: (value) => {
        return value.replace(/\D/g, '').slice(0, 4);
    }
};

// Validações
const validators = {
    cpf: (cpf) => {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;

        // Elimina CPFs inválidos conhecidos
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        // Valida 1º dígito
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        let digito1 = resto === 10 || resto === 11 ? 0 : resto;
        if (digito1 !== parseInt(cpf.charAt(9))) return false;

        // Valida 2º dígito
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        let digito2 = resto === 10 || resto === 11 ? 0 : resto;
        return digito2 === parseInt(cpf.charAt(10));
    },

    cnpj: (cnpj) => {
        cnpj = cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) return false;

        // Elimina CNPJs inválidos conhecidos
        if (/^(\d)\1{13}$/.test(cnpj)) return false;

        // Valida 1º dígito
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado != digitos.charAt(0)) return false;

        // Valida 2º dígito
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        return resultado == digitos.charAt(1);
    },

    email: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    phone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    },

    cardNumber: (number) => {
        // Algoritmo de Luhn
        const cleaned = number.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) return false;

        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    },

    cardExpiry: (expiry) => {
        const cleaned = expiry.replace(/\D/g, '');
        if (cleaned.length !== 4) return false;

        const month = parseInt(cleaned.substring(0, 2));
        const year = parseInt('20' + cleaned.substring(2, 4));

        if (month < 1 || month > 12) return false;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    },

    cardCvv: (cvv) => {
        const cleaned = cvv.replace(/\D/g, '');
        return cleaned.length >= 3 && cleaned.length <= 4;
    }
};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeMasks();
    initializePaymentMethods();
    initializeFormValidation();
    initializePixActions();
    initializeFormMonitoring();
});

// Inicializa as máscaras de input
function initializeMasks() {
    const cpfCnpjInput = document.getElementById('cpfCnpj');
    const phoneInput = document.getElementById('phone');
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCvvInput = document.getElementById('cardCvv');
    const cepInput = document.getElementById('cep');

    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', (e) => {
            e.target.value = masks.cpfCnpj(e.target.value);
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = masks.phone(e.target.value);
        });
    }

    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            e.target.value = masks.cardNumber(e.target.value);
            detectCardBrand(e.target.value);
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            e.target.value = masks.cardExpiry(e.target.value);
        });
    }

    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            e.target.value = masks.cardCvv(e.target.value);
        });
    }

}

// Detecta a bandeira do cartão
function detectCardBrand(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    let brand = 'unknown';

    if (/^4/.test(cleaned)) brand = 'visa';
    else if (/^5[1-5]/.test(cleaned)) brand = 'mastercard';
    else if (/^3[47]/.test(cleaned)) brand = 'amex';
    else if (/^6(?:011|5)/.test(cleaned)) brand = 'discover';
    else if (/^35/.test(cleaned)) brand = 'jcb';
    else if (/^(?:2131|1800|35)/.test(cleaned)) brand = 'jcb';
    else if (/^50|^6[37]/.test(cleaned)) brand = 'elo';

    // Você pode adicionar lógica para mostrar o ícone da bandeira aqui
    console.log('Bandeira detectada:', brand);
}

// Inicializa os métodos de pagamento
function initializePaymentMethods() {
    const paymentButtons = document.querySelectorAll('.payment-method');
    const pixSection = document.getElementById('pixSection');
    const creditSection = document.getElementById('creditSection');

    paymentButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active de todos os botões
            paymentButtons.forEach(btn => btn.classList.remove('active'));

            // Adiciona active no botão clicado
            button.classList.add('active');

            // Mostra/esconde seções baseado no método selecionado
            const method = button.dataset.method;

            if (method === 'pix') {
                pixSection.style.display = 'flex';
                creditSection.style.display = 'none';
            } else if (method === 'credit') {
                pixSection.style.display = 'none';
                creditSection.style.display = 'block';
            }
        });
    });
}

// Inicializa validação do formulário
function initializeFormValidation() {
    const form = document.getElementById('checkoutForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            console.log('📝 Formulário submetido!');

            if (validateForm()) {
                console.log('✅ Validação passou, processando pagamento...');
                submitForm();
            } else {
                console.log('❌ Validação falhou');
            }
        });

        // Validação em tempo real
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
        });
    } else {
        console.error('❌ Formulário não encontrado!');
    }
}

// Valida um campo individual
function validateField(input) {
    const fieldName = input.name;
    const value = input.value;
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
        case 'fullName':
            isValid = value.trim().length >= 3;
            errorMessage = 'Nome deve ter pelo menos 3 caracteres';
            break;
        case 'email':
            isValid = validators.email(value);
            errorMessage = 'Email inválido';
            break;
        case 'cpfCnpj':
            const cleaned = value.replace(/\D/g, '');
            isValid = cleaned.length === 11 ? validators.cpf(value) : validators.cnpj(value);
            errorMessage = 'CPF/CNPJ inválido';
            break;
        case 'phone':
            isValid = validators.phone(value);
            errorMessage = 'Telefone inválido';
            break;
        case 'cardNumber':
            isValid = validators.cardNumber(value);
            errorMessage = 'Número do cartão inválido';
            break;
        case 'cardName':
            isValid = value.trim().length >= 3;
            errorMessage = 'Nome no cartão inválido';
            break;
        case 'cardExpiry':
            isValid = validators.cardExpiry(value);
            errorMessage = 'Data de validade inválida';
            break;
        case 'cardCvv':
            isValid = validators.cardCvv(value);
            errorMessage = 'CVV inválido';
            break;
    }

    // Remove erro anterior
    removeFieldError(input);

    // Adiciona erro se inválido
    if (!isValid && value.length > 0) {
        addFieldError(input, errorMessage);
    }

    return isValid;
}

// Adiciona erro visual no campo
function addFieldError(input, message) {
    input.style.borderColor = 'var(--error-red)';

    const errorElement = document.createElement('span');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--error-red)';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '0.25rem';
    errorElement.style.display = 'block';

    input.parentElement.appendChild(errorElement);
}

// Remove erro visual do campo
function removeFieldError(input) {
    input.style.borderColor = '';
    const errorElement = input.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Valida todo o formulário
function validateForm() {
    const form = document.getElementById('checkoutForm');
    const requiredFields = form.querySelectorAll('input[required]');
    let isValid = true;

    requiredFields.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });

    // Valida campos do cartão se o método for cartão de crédito
    const activeMethod = document.querySelector('.payment-method.active');
    if (activeMethod && activeMethod.dataset.method === 'credit') {
        const cardFields = ['cardNumber', 'cardName', 'cardExpiry', 'cardCvv'];
        cardFields.forEach(fieldName => {
            const input = document.getElementById(fieldName);
            if (input && !validateField(input)) {
                isValid = false;
            }
        });
    }

    if (!isValid) {
        showNotification('Por favor, corrija os erros no formulário', 'error');
    }

    return isValid;
}

// Submete o formulário
async function submitForm() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const activeMethod = document.querySelector('.payment-method.active');

    data.paymentMethod = activeMethod ? activeMethod.dataset.method : 'pix';

    console.log('💰 Dados do formulário:', data);
    console.log('💳 Método de pagamento:', data.paymentMethod);

    // Se o método for cartão de crédito, processa via Kiwify
    if (data.paymentMethod === 'credit') {
        console.log('🔵 Processando via cartão de crédito (Kiwify)...');
        await processCardPayment(data);
    } else {
        console.log('🔵 Método PIX - já processado automaticamente');
        // PIX já é processado automaticamente ao preencher os campos
        showNotification('Por favor, efetue o pagamento via PIX', 'info');
    }
}

// Processa pagamento com cartão via Kiwify
async function processCardPayment(data) {
    try {
        console.log('💳 Iniciando processamento de cartão...');
        console.log('📦 Dados recebidos:', data);

        showNotification('Processando pagamento com cartão...', 'info');

        const amount = window.currentProductPrice || 19.90;

        const payloadData = {
            nome: data.fullName,
            email: data.email,
            cpf: data.cpfCnpj,
            telefone: data.phone,
            cardNumber: data.cardNumber,
            cardName: data.cardName,
            cardExpiry: data.cardExpiry,
            cardCvv: data.cardCvv,
            amount: amount
        };

        console.log('📤 Enviando para /process-card:', payloadData);

        const response = await fetch('/process-card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadData)
        });

        console.log('📡 Status da resposta:', response.status);

        const result = await response.json();

        console.log('📦 Resposta do pagamento:', result);

        if (result.success) {
            showNotification('✅ Pagamento aprovado com sucesso!', 'success');

            // Redirecionar para página de sucesso após 2 segundos
            setTimeout(() => {
                // window.location.href = '/sucesso';
                console.log('🔀 Redirecionar para página de sucesso');
            }, 2000);
        } else {
            console.error('❌ Erro no pagamento:', result);
            showNotification('❌ ' + (result.error || 'Erro ao processar pagamento'), 'error');
        }

    } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        showNotification('❌ Erro ao processar pagamento. Tente novamente.', 'error');
    }
}

// Inicializa ações do PIX
function initializePixActions() {
    const copyButton = document.querySelector('.btn-copy-pix');
    const paymentDoneButton = document.querySelector('.btn-payment-done');

    // Variável global para armazenar dados do pagamento atual
    window.currentPayment = window.currentPayment || {};

    if (paymentDoneButton) {
        paymentDoneButton.addEventListener('click', async () => {
            if (!validateForm()) {
                return;
            }

            // Verifica se tem um transactionId
            if (!window.currentPayment.transactionId) {
                showNotification('Gere o QR Code PIX primeiro!', 'error');
                return;
            }

            try {
                // Desabilita o botão temporariamente
                paymentDoneButton.disabled = true;
                paymentDoneButton.textContent = 'Verificando...';

                showNotification('Verificando pagamento...', 'info');

                // Chama API para verificar status
                const response = await fetch('/check-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        transactionId: window.currentPayment.transactionId
                    })
                });

                const result = await response.json();

                console.log('Status do pagamento:', result);

                // Verifica se o pagamento foi confirmado
                if (result.success && result.data) {
                    const status = result.data.status || result.data.paymentStatus;

                    if (status === 'PAID' || status === 'CONFIRMED' || status === 'APPROVED') {
                        showNotification('✅ Pagamento confirmado! Obrigado pela compra.', 'success');
                        // Redirecionar para página de sucesso
                        setTimeout(() => {
                            // window.location.href = '/sucesso';
                            console.log('Redirecionar para página de sucesso');
                        }, 2000);
                    } else {
                        showNotification('⏳ Aguardando pagamento... Por favor, efetue o pagamento para continuar.', 'info');

                        // Inicia verificação automática a cada 5 segundos
                        startPaymentPolling();
                    }
                } else {
                    showNotification('⏳ Aguardando pagamento...', 'info');
                    startPaymentPolling();
                }

            } catch (error) {
                console.error('Erro ao verificar pagamento:', error);
                showNotification('Erro ao verificar pagamento. Aguardando confirmação...', 'error');
            } finally {
                // Reabilita o botão
                paymentDoneButton.disabled = false;
                paymentDoneButton.textContent = 'Já fiz o pagamento';
            }
        });
    }
}

// Função para verificar pagamento automaticamente
let pollingInterval = null;

function startPaymentPolling() {
    // Limpa qualquer polling anterior
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    console.log('Iniciando verificação automática do pagamento...');

    pollingInterval = setInterval(async () => {
        if (!window.currentPayment.transactionId) {
            clearInterval(pollingInterval);
            return;
        }

        try {
            const response = await fetch('/check-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transactionId: window.currentPayment.transactionId
                })
            });

            const result = await response.json();

            if (result.success && result.data) {
                const status = result.data.status || result.data.paymentStatus;

                if (status === 'PAID' || status === 'CONFIRMED' || status === 'APPROVED') {
                    clearInterval(pollingInterval);
                    showNotification('✅ Pagamento confirmado! Obrigado pela compra.', 'success');

                    setTimeout(() => {
                        // window.location.href = '/sucesso';
                        console.log('Redirecionar para página de sucesso');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Erro no polling:', error);
        }
    }, 5000); // Verifica a cada 5 segundos
}

// Monitora preenchimento dos campos para mostrar QR Code
function initializeFormMonitoring() {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const cpfCnpjInput = document.getElementById('cpfCnpj');
    const phoneInput = document.getElementById('phone');
    const pixSection = document.getElementById('pixSection');
    const creditSection = document.getElementById('creditSection');
    const paymentMethods = document.getElementById('paymentMethods');
    const paymentWarning = document.getElementById('paymentWarning');

    // Array com todos os campos obrigatórios
    const requiredFields = [fullNameInput, emailInput, cpfCnpjInput, phoneInput];

    // Variável para armazenar dados do PIX
    let pixPaymentData = null;

    // Função para verificar se todos os campos estão preenchidos
    async function checkFieldsAndShowQRCode() {
        // Verifica se todos os campos estão preenchidos
        const allFieldsFilled = requiredFields.every(field => {
            if (!field) return false;
            const value = field.value.trim();
            return value.length > 0;
        });

        // Valida os campos básicos
        const isNameValid = fullNameInput && fullNameInput.value.trim().length >= 3;
        const isEmailValid = emailInput && validators.email(emailInput.value);
        const isCpfCnpjValid = cpfCnpjInput && (validators.cpf(cpfCnpjInput.value) || validators.cnpj(cpfCnpjInput.value));
        const isPhoneValid = phoneInput && validators.phone(phoneInput.value);

        const allFieldsValid = allFieldsFilled && isNameValid && isEmailValid && isCpfCnpjValid && isPhoneValid;

        // Habilita/desabilita os botões de pagamento
        if (allFieldsValid) {
            paymentMethods.style.opacity = '1';
            paymentMethods.style.pointerEvents = 'auto';
            paymentWarning.classList.add('hidden');
        } else {
            paymentMethods.style.opacity = '0.5';
            paymentMethods.style.pointerEvents = 'none';
            paymentWarning.classList.remove('hidden');
            // Esconde seções de pagamento se dados inválidos
            pixSection.style.display = 'none';
            if (creditSection) creditSection.style.display = 'none';
            return;
        }

        // Verifica qual método está ativo
        const activeMethod = document.querySelector('.payment-method.active');

        // Só mostra seções se método estiver selecionado
        if (activeMethod) {
            if (activeMethod.dataset.method === 'pix') {
                // Se ainda não criou o PIX, cria agora
                if (!pixPaymentData && allFieldsValid) {
                    await createPixPaymentRequest();
                }
                pixSection.style.display = 'flex';
                if (creditSection) creditSection.style.display = 'none';
            } else if (activeMethod.dataset.method === 'credit') {
                pixSection.style.display = 'none';
                if (creditSection) creditSection.style.display = 'block';
            }
        }
    }

    // Função para criar pagamento PIX via API
    async function createPixPaymentRequest() {
        try {
            showNotification('Gerando QR Code PIX...', 'info');

            const amount = window.currentProductPrice || 19.90;

            const response = await fetch('/generate-pix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: fullNameInput.value.trim(),
                    email: emailInput.value.trim(),
                    cpf: cpfCnpjInput.value.replace(/\D/g, ''),
                    telefone: phoneInput.value.replace(/\D/g, ''),
                    amount: amount
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao gerar PIX');
            }

            const result = await response.json();
            pixPaymentData = result.data;

            console.log('📦 Resposta completa do servidor:', result);
            console.log('💳 Dados do PIX:', pixPaymentData);

            // Salva transactionId globalmente
            window.currentPayment = {
                transactionId: pixPaymentData.transactionId,
                pixData: pixPaymentData
            };

            console.log('💾 Transaction ID salvo:', window.currentPayment.transactionId);

            // Atualiza QR Code se a API retornar
            if (pixPaymentData.qrCodeBase64 || pixPaymentData.qrCode || pixPaymentData.qrCodeImage) {
                updateQRCode(pixPaymentData);
            }

            // Atualiza código PIX para copiar
            if (pixPaymentData.pixCode || pixPaymentData.qrCodeText) {
                updatePixCode(pixPaymentData.pixCode || pixPaymentData.qrCodeText);
            }

            showNotification('QR Code gerado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao criar PIX:', error);

            // Remove o loading e mostra mensagem de erro mais clara
            const qrContainer = document.getElementById('qrCodeImage');

            if (error.message.includes('403') || error.message.includes('Forbidden')) {
                qrContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #f44336;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem;">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <h3 style="color: #f44336; margin: 0.5rem 0;">Erro de Autenticação</h3>
                        <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">
                            As credenciais da API Vizzion Pay não estão autorizadas.
                        </p>
                        <p style="color: #666; font-size: 0.85rem; margin: 1rem 0;">
                            <strong>Como resolver:</strong><br>
                            1. Acesse seu painel Vizzion Pay<br>
                            2. Verifique se a API está ativada<br>
                            3. Gere novas chaves de API<br>
                            4. Atualize o arquivo .env
                        </p>
                    </div>
                `;
                showNotification('Erro de autenticação com Vizzion Pay. Verifique suas credenciais.', 'error');
            } else {
                qrContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #f44336;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem;">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <h3 style="color: #f44336; margin: 0.5rem 0;">Erro ao gerar PIX</h3>
                        <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">
                            ${error.message || 'Erro desconhecido'}
                        </p>
                    </div>
                `;
                showNotification(error.message || 'Erro ao gerar PIX. Tente novamente.', 'error');
            }
        }
    }

    // Atualiza o QR Code na tela
    function updateQRCode(data) {
        const qrContainer = document.getElementById('qrCodeImage');

        // Se a API retornar URL da imagem do QR Code
        if (data.qrCodeImage || data.qrCode) {
            const qrUrl = data.qrCodeImage || data.qrCode;
            qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code PIX" style="width: 100%; height: auto; border-radius: 8px;">`;
        }
        // Se retornar base64
        else if (data.qrCodeBase64) {
            qrContainer.innerHTML = `<img src="data:image/png;base64,${data.qrCodeBase64}" alt="QR Code PIX" style="width: 100%; height: auto; border-radius: 8px;">`;
        }
        // Se retornar o texto do QR Code, pode usar uma biblioteca para gerar
        else if (data.qrCodeText || data.pixCode) {
            // Por enquanto apenas mostra mensagem
            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <p style="color: #666; margin: 0;">QR Code recebido</p>
                    <small style="color: #999;">Use o botão abaixo para copiar o código</small>
                </div>
            `;
        }
    }

    // Atualiza o código PIX
    function updatePixCode(pixCode) {
        const copyButton = document.querySelector('.btn-copy-pix');
        if (copyButton) {
            copyButton.onclick = () => {
                copyToClipboard(pixCode);
                showNotification('Código PIX copiado!', 'success');
            };
        }
    }

    // Adiciona evento de input em todos os campos
    requiredFields.forEach(field => {
        if (field) {
            field.addEventListener('input', checkFieldsAndShowQRCode);
            field.addEventListener('blur', checkFieldsAndShowQRCode);
        }
    });

    // Verifica quando mudar o método de pagamento
    const paymentButtons = document.querySelectorAll('.payment-method');
    paymentButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(checkFieldsAndShowQRCode, 100);
        });
    });

    // Verifica inicialmente
    checkFieldsAndShowQRCode();
}

// Copia texto para clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback para navegadores mais antigos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Gera string aleatória
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Mostra notificação
function showNotification(message, type = 'info') {
    // Remove notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Estilos
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 1.5rem';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = '600';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    notification.style.animation = 'slideIn 0.3s ease';
    notification.style.maxWidth = '400px';

    switch (type) {
        case 'success':
            notification.style.background = 'var(--success-green)';
            break;
        case 'error':
            notification.style.background = 'var(--error-red)';
            break;
        case 'info':
            notification.style.background = 'var(--primary-blue)';
            break;
    }

    document.body.appendChild(notification);

    // Remove após 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Adiciona animação de slideOut
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll para âncoras
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Adiciona loading state nos botões
function addLoadingState(button) {
    button.classList.add('loading');
    button.disabled = true;
    const originalText = button.textContent;
    button.dataset.originalText = originalText;
    button.textContent = 'Processando...';
    return originalText;
}

function removeLoadingState(button) {
    button.classList.remove('loading');
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
}

// Inicializa valores de preço fixo
window.currentProductPrice = 39.90;

