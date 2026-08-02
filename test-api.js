const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

fetch('http://localhost:3000/api/processar-gabarito', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imagem: imageBase64 })
})
.then(res => res.json())
.then(data => console.log('✅ Resposta:', data))
.catch(err => console.error('❌ Erro:', err));
