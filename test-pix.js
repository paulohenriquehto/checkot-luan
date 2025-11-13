// Teste de geração de PIX - R$ 15,00

const testData = {
    name: 'Teste Cliente',
    email: 'teste@exemplo.com',
    document: '12345678900',
    phone: '44999999999'
};

console.log('🧪 Iniciando teste de geração de PIX...\n');
console.log('📋 Dados do teste:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n💰 Valor: R$ 15,00\n');

fetch('http://localhost:3000/api/create-pix', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
})
.then(response => {
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}\n`);
    return response.json();
})
.then(data => {
    if (data.success) {
        console.log('✅ SUCESSO! PIX gerado com sucesso!\n');
        console.log('📦 Resposta completa:');
        console.log(JSON.stringify(data, null, 2));

        if (data.data.qrCode) {
            console.log('\n🎯 QR Code PIX gerado!');
            console.log('Código:', data.data.qrCode.substring(0, 50) + '...');
        }

        if (data.data.qrCodeImage) {
            console.log('\n🖼️ Imagem do QR Code disponível!');
        }

        if (data.data.demo) {
            console.log('\n⚠️ ATENÇÃO: Este é um QR Code de demonstração');
        }
    } else {
        console.log('❌ ERRO! Falha ao gerar PIX\n');
        console.log('📦 Resposta:');
        console.log(JSON.stringify(data, null, 2));
    }
})
.catch(error => {
    console.error('❌ ERRO NA REQUISIÇÃO:\n');
    console.error(error.message);
});
