import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
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

pool
  .connect()
  .then(() => console.log("Postgres OK ✅"))
  .catch((err) => console.error("Erro Postgres ❌", err));

// -------------------
// Configuração MailerSend
// -------------------
const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const ADMIN_EMAIL = "conclusaovitoria@proton.me";

async function enviarEmailRedefinirSenha(nome, email, token) {
  const link = `https://seu_frontend_url/login.html?token=${token}`;
  const from = new Sender(
    "naoresponda@test-q3enl6kvmkr42vwr.mlsender.net",
    "Conclusão Vitória"
  );
  const recipients = [new Recipient(email, nome)];

  const personalization = [
    {
      email,
      data: {
        name: nome,
        account_name: "Conclusão Vitória",
        action_url: link,
      },
    },
  ];

  const emailParams = new EmailParams()
    .setFrom(from)
    .setTo(recipients)
    .setSubject("Redefinição de senha")
    .setTemplateId("pr9084zyo18gw63d")
    .setPersonalization(personalization);

  await mailer.email.send(emailParams);
}

// -------------------
// Middleware JWT
// -------------------
function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ erro: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, "segredo123", (err, user) => {
    if (err) return res.status(403).json({ erro: "Token inválido" });
    req.user = user;
    next();
  });
}

// -------------------
// Configuração Multer
// -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", req.params.id);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({ storage });

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
      return res
        .status(400)
        .json({ erro: "Email ou matrícula já cadastrados" });
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// -------------------
// Login
// -------------------
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0)
      return res.status(400).json({ erro: "Usuário não encontrado" });

    const user = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaValida)
      return res.status(400).json({ erro: "Senha incorreta" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      "segredo123",
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
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
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0)
      return res.status(400).json({ erro: "Email não cadastrado" });

    const token = crypto.randomBytes(20).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

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
      `SELECT * FROM resetSenha
       WHERE token = $1 AND usado = false AND expira_em > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0)
      return res.status(400).json({ erro: "Token inválido ou expirado" });

    const userId = tokenResult.rows[0].user_id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query(
      "UPDATE users SET senha_hash = $1 WHERE id = $2",
      [senhaHash, userId]
    );

    await pool.query("UPDATE resetSenha SET usado = true WHERE id = $1", [
      tokenResult.rows[0].id,
    ]);

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// -------------------
// Criar ordem
// -------------------
app.post("/api/ordens", autenticarJWT, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const {
      tipo_solicitacao,
      local_tipo,
      local_detalhe,
      descricao,
      observacoes,
      equipamento,
      tipo_problema,
      app_nome,
      app_versao,
      app_link,
    } = req.body;

    const resultOrdem = await pool.query(
      `INSERT INTO ordens
       (usuario_id, tipo_solicitacao, local_tipo, local_detalhe, descricao, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [usuarioId, tipo_solicitacao, local_tipo, local_detalhe, descricao, observacoes]
    );

    const ordemId = resultOrdem.rows[0].id;

    if (tipo_solicitacao === "problema" && equipamento && tipo_problema) {
      await pool.query(
        `INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
         VALUES ($1,$2,$3)`,
        [ordemId, equipamento, tipo_problema]
      );
    }

    if (tipo_solicitacao === "instalacao" && app_nome) {
      await pool.query(
        `INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao, app_link)
         VALUES ($1,$2,$3,$4)`,
        [ordemId, app_nome, app_versao || null, app_link || null]
      );
    }

    res
      .status(201)
      .json({ mensagem: "Ordem criada com sucesso!", ordem: resultOrdem.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar ordem" });
  }
});

// -------------------
// Upload de anexos
// -------------------
app.post(
  "/api/ordens/:id/anexos",
  autenticarJWT,
  upload.array("file-upload"),
  async (req, res) => {
    try {
      const ordemId = req.params.id;
      const arquivos = req.files;

      if (!arquivos || arquivos.length === 0)
        return res.status(400).json({ erro: "Nenhum arquivo enviado" });

      for (const arquivo of arquivos) {
        await pool.query(
          `INSERT INTO ordens_anexos (ordem_id, arquivo_nome, arquivo_url)
           VALUES ($1,$2,$3)`,
          [ordemId, arquivo.originalname, arquivo.path]
        );
      }

      res.json({
        mensagem: "Arquivos enviados com sucesso",
        arquivos: arquivos.map((a) => a.filename),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro ao enviar arquivos" });
    }
  }
);

// -------------------
// Listar ordens do usuário (professor)
// -------------------
app.get("/api/minhas-ordens", autenticarJWT, async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const result = await pool.query(
      `SELECT o.*, 
              p.equipamento, p.tipo_problema, 
              i.app_nome, i.app_versao, i.app_link,
              json_agg(json_build_object('arquivo_nome', a.arquivo_nome, 'arquivo_url', a.arquivo_url))
                FILTER (WHERE a.id IS NOT NULL) AS anexos
       FROM ordens o
       LEFT JOIN ordens_problemas p ON o.id = p.ordem_id
       LEFT JOIN ordens_instalacoes i ON o.id = i.ordem_id
       LEFT JOIN ordens_anexos a ON o.id = a.ordem_id
       WHERE o.usuario_id = $1
       GROUP BY o.id, p.equipamento, p.tipo_problema, i.app_nome, i.app_versao, i.app_link
       ORDER BY o.data_criacao DESC`,
      [usuarioId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar ordens do usuário" });
  }
});

// -------------------
// Listar ordens (suporte)
// -------------------
app.get("/api/ordens/suporte", autenticarJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              p.equipamento, p.tipo_problema, 
              i.app_nome, i.app_versao, i.app_link,
              json_agg(json_build_object('arquivo_nome', a.arquivo_nome, 'arquivo_url', a.arquivo_url))
                FILTER (WHERE a.id IS NOT NULL) AS anexos
       FROM ordens o
       LEFT JOIN ordens_problemas p ON o.id = p.ordem_id
       LEFT JOIN ordens_instalacoes i ON o.id = i.ordem_id
       LEFT JOIN ordens_anexos a ON o.id = a.ordem_id
       GROUP BY o.id, p.equipamento, p.tipo_problema, i.app_nome, i.app_versao, i.app_link
       ORDER BY o.data_criacao DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar ordens" });
  }
});

// -------------------
// Assumir ordem
// -------------------
app.patch("/api/ordens/:id/accept", autenticarJWT, async (req, res) => {
  const ordemId = req.params.id;
  const { userId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE ordens 
       SET responsavel_id = $1, status = 'Em Andamento'
       WHERE id = $2
       RETURNING *`,
      [userId, ordemId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Ordem não encontrada" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao assumir ordem" });
  }
});

// -------------------
// Finalizar ordem
// -------------------
app.patch("/api/ordens/:id/status", autenticarJWT, async (req, res) => {
  const ordemId = req.params.id;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE ordens SET status = $1 WHERE id = $2 RETURNING *`,
      [status, ordemId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Ordem não encontrada" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar status" });
  }
});

// -------------------
// Servir frontend
// -------------------
const frontPath = path.resolve(__dirname, "../front-end");
app.use(express.static(frontPath));

app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(frontPath, "index.html"))
);

// -------------------
// Rodar servidor
// -------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀`));

export default app;
