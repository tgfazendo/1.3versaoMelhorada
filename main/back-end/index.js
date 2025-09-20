import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

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
// Configuração MailerSend
// -------------------
const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Email administrador da trial (tem que ser o mesmo cadastrado no painel)
const ADMIN_EMAIL = "conclusaovitoria@proton.me";

// -------------------
// Função utilitária para envio de email
// -------------------
async function enviarEmailRedefinirSenha(nome, email, token) {
  // Trial só permite envio para o admin → sobrescrevemos destinatário
  const destinatario = ADMIN_EMAIL;

  // link que o usuário vai clicar → seu front deve tratar esse token
  const link = `https://bdd339d3-9d30-4502-bb65-c2df41043c71-00-19kadynhvjmtz.spock.replit.dev/login.html?token=${token}`;


  const from = new Sender(
    "naoresponda@test-q3enl6kvmkr42vwr.mlsender.net", 
    "Conclusão Vitória"
  );

  const recipients = [new Recipient(destinatario, nome)];

  // Essas variáveis têm que bater com o que está no template do MailerSend
  const personalization = [
    {
      email: destinatario,
      data: {
        name: nome,
        account_name: "Conclusão Vitória",
        action_url: link,
        support_url: "mailto:suporte@seudominio.com"
      },
    },
  ];

  const emailParams = new EmailParams()
    .setFrom(from)
    .setTo(recipients)
    .setSubject("Redefinição de senha") 
    .setTemplateId("pr9084zyo18gw63d") // ID do template no MailerSend
    .setPersonalization(personalization);

  await mailer.email.send(emailParams);
}

// -------------------
// Cadastro de usuário
// -------------------
app.post("/api/cadastro", async (req, res) => {
  const { nome, email, senha, matricula } = req.body;
  try {
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

// -------------------
// Login
// -------------------
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

// -------------------
// Recuperar senha
// -------------------
app.post("/api/recuperar-senha", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ erro: "Email não cadastrado" });

    const token = crypto.randomBytes(20).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      `INSERT INTO resetSenha (user_id, token, expira_em, usado)
       VALUES ($1, $2, $3, $4)`,
      [result.rows[0].id, token, expiraEm, false]
    );

    await enviarEmailRedefinirSenha(result.rows[0].nome, email, token);

    res.json({ message: "Link de recuperação enviado por email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// -------------------
// Redefinir senha
// -------------------
app.post("/api/redefinir-senha", async (req, res) => {
  const { token, novaSenha } = req.body;
  try {
    const tokenResult = await pool.query(
      `SELECT * FROM resetSenha WHERE token = $1 AND usado = false AND expira_em > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0)
      return res.status(400).json({ erro: "Token inválido ou expirado" });

    const userId = tokenResult.rows[0].user_id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query(`UPDATE users SET senha_hash = $1 WHERE id = $2`, [senhaHash, userId]);
    await pool.query(`UPDATE resetSenha SET usado = true WHERE id = $1`, [tokenResult.rows[0].id]);

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// -------------------
// Middleware JWT
// -------------------
function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ erro: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, "segredo123", (err, user) => {
    if (err) return res.status(403).json({ erro: "Token inválido" });
    req.user = user;
    next();
  });
}

// -------------------
// Rota para buscar ordens
// -------------------
app.get("/api/ordens", autenticarJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT id, titulo, descricao, status, data_criacao FROM ordens WHERE professor_id = $1 ORDER BY data_criacao DESC",
      [userId]
    );

    const ordens = result.rows.map(o => ({
      codigo: "ORD-" + o.id.toString().padStart(4, "0"),
      titulo: o.titulo,
      descricao: o.descricao,
      status: o.status,
      statusNome: o.status === "pending" ? "Pendente" :
                  o.status === "in-progress" ? "Em Andamento" : "Concluída",
      statusIcon: o.status === "pending" ? "clock" :
                  o.status === "in-progress" ? "spinner" : "check",
      data: new Date(o.data_criacao).toLocaleDateString("pt-BR")
    }));

    res.json(ordens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar ordens" });
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
