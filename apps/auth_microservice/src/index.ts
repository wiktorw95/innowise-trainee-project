import express from 'express';

const app = express();
const PORT = 3002;

app.get('/health', (req, res) => res.send('Auth Service OK'));

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on http://localhost:${PORT}`);
});
