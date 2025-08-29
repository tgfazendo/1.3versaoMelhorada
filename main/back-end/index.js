// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// -------------------
// Middleware
// -------------------
app.use(cors());
app.use(express.json());

// -------------------
// Conectar ao Postgres
// -------------------
const pool = new Pool({
  user: "meu_usuario",
  host: "127.0.0.1",
  database: "meu_banco",
  password: "sua_senha",
  port: 5432,
});

// Teste rápido de conexão no start
pool.connect()
  .then(() => console.log("Conexão com o Postgres OK ✅"))
  .catch(err => console.error("Erro ao conectar no Postgres ❌", err));

// ======================= ROTAS ======================= //

// Verificar matrícula antes de cadastrar
app.post("/api/verificar-matricula", async (req, res) => {
  const { matricula } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM matriculas_autorizadas WHERE matricula = $1 AND status = 'ativa'",
      [matricula]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Matrícula inválida ou inativa." });
    }
    res.json({ autorizado: true, dados: result.rows[0] });
  } catch (err) {
    console.error("Erro verificar matrícula:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Cadastro
app.post("/api/cadastro", async (req, res) => {
  const { nome, email, senha, matricula } = req.body;
  try {
    const matriculaResult = await pool.query(
      "SELECT * FROM matriculas_autorizadas WHERE matricula = $1 AND status = 'ativa'",
      [matricula]
    );
    if (matriculaResult.rows.length === 0) {
      return res.status(400).json({ message: "Matrícula inválida ou inativa." });
    }

    const role = matriculaResult.rows[0].role;
    const senhaHash = await bcrypt.hash(senha, 10);

    const userResult = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, matricula, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, matricula, role`,
      [nome, email, senhaHash, matricula, role]
    );

    res.status(201).json(userResult.rows[0]);
  } catch (err) {
    console.error("Erro no cadastro:", err);  // <-- log completo do erro
    if (err.message.includes("duplicate key")) {
      return res.status(400).json({ message: "Email ou matrícula já cadastrados." });
    }
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    const user = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(400).json({ message: "Senha incorreta." });
    }

    res.json({
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        matricula: user.matricula,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// -------------------
// Servir frontend
// -------------------
const frontPath = path.resolve(__dirname, "../front-end");
app.use(express.static(frontPath));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontPath, "index.html"));
});

// -------------------
// Rodar servidor
// -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Servidor rodando na porta ${PORT} 🚀`));
