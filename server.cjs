const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente com base no ambiente
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.local' });
}

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://venhavender.com'],
  credentials: true
}));
app.use(express.json());

// Importar e usar as rotas da API
app.use('/api', require('./api/stripe-create-payment-intent-express.cjs'));
app.use('/api', require('./api/stripe-create-checkout-session-express.cjs'));
app.use('/api', require('./api/stripe-confirm-payment-express.cjs'));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Rota para SPA (apenas para produção)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 APIs disponíveis em http://localhost:${PORT}/api/`);
});
