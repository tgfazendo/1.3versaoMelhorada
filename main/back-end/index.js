import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// -------------------
// Conexão com Postgres
// -------------------
const pool = new Pool({
  user: "meu_usuario",
  host: "127.0.0.1",
  database: "meu_banco",
  password: "sua_senha",
  port: 5432,
});

pool.connect()
  .then(() => console.log("Postgres OK ✅"))
  .catch(err => console.error("Erro Postgres ❌", err));

// -------------------
// ROTAS
// -------------------

// Cadastro de usuário
app.post("/api/cadastro", async (req, res) => {
  const { nome, email, senha, matricula } = req.body;
  try {
    // Verifica matrícula
    const matriculaResult = await pool.query(
      "SELECT * FROM matriculas_autorizadas WHERE matricula = $1 AND status = 'ativa'",
      [matricula]
    );
    if (matriculaResult.rows.length === 0)
      return res.status(400).json({ erro: "Matrícula inválida ou inativa" });

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
    console.error(err);
    if (err.message.includes("duplicate key"))
      return res.status(400).json({ erro: "Email ou matrícula já cadastrados" });
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ erro: "Usuário não encontrado" });

    const user = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) return res.status(400).json({ erro: "Senha incorreta" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      "segredo123",
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// Recuperar senha
app.post("/api/recuperar-senha", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ erro: "Email não cadastrado" });

    // Gera token aleatório
    const token = crypto.randomBytes(20).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Salva token no banco
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expira_em, usado)
       VALUES ($1, $2, $3, $4)`,
      [result.rows[0].id, token, expiraEm, false]
    );

    // Aqui você enviaria email com link de recuperação
    console.log(`Link para redefinir senha: http://localhost:3000/redefinir-senha?token=${token}`);

    res.json({ message: "Link de recuperação enviado!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// Redefinir senha
app.post("/api/redefinir-senha", async (req, res) => {
  const { token, novaSenha } = req.body;
  try {
    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND usado = false AND expira_em > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0)
      return res.status(400).json({ erro: "Token inválido ou expirado" });

    const userId = tokenResult.rows[0].user_id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query(
      `UPDATE users SET senha_hash = $1 WHERE id = $2`,
      [senhaHash, userId]
    );

    await pool.query(
      `UPDATE password_reset_tokens SET usado = true WHERE id = $1`,
      [tokenResult.rows[0].id]
    );

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
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
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀`));
