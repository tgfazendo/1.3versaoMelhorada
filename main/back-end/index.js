import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import ordemRoutes from "./routes/ordemRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", authRoutes);
app.use("/api", ordemRoutes);

// Servir frontend
const frontPath = path.resolve(__dirname, "../front-end");
app.use(express.static(frontPath));
app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(frontPath, "index.html"))
);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀`));

export default app;

//mudança pro sistema reconhecer a passagem de tempo e atualizar os alertas
import pool from './config/db.js';

async function atualizarAlertas() {
  await pool.query('SELECT calcula_alerta();');
}

setInterval(atualizarAlertas, 24 * 60 * 60 * 1000); // roda todo dia

// isso daqui é do perfil
import perfilRoutes from './routes/perfil.js'; // rota que vamos criar
app.use('/perfil', perfilRoutes);

// Servir arquivos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
