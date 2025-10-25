const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
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
