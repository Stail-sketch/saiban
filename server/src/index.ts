import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handler.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://stail-sketch.github.io',
];

app.use(cors({ origin: allowedOrigins }));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', game: '異議アリ！' });
});

setupSocketHandlers(io);

const PORT = parseInt(process.env.PORT || '3001');
httpServer.listen(PORT, () => {
  console.log(`🔨 異議アリ！サーバー起動 — ポート ${PORT}`);
});
