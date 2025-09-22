CREATE TABLE ordens (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- quem criou
    responsavel_id INT REFERENCES users(id) ON DELETE SET NULL, -- usuário do suporte atribuído
    tipo_solicitacao VARCHAR(20) NOT NULL CHECK (tipo_solicitacao IN ('problema', 'instalacao')),
    local_tipo VARCHAR(20) NOT NULL CHECK (local_tipo IN ('sala', 'laboratorio')),
    local_detalhe VARCHAR(255), -- "Sala 101" ou "Lab 202 - Posição 12"
    descricao TEXT NOT NULL,    -- descrição geral do problema ou da instalação
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Aberta' CHECK (status IN ('Aberta','Em Andamento','Finalizada'))
);

CREATE OR REPLACE FUNCTION atualiza_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualiza_ordem
BEFORE UPDATE ON ordens
FOR EACH ROW
EXECUTE FUNCTION atualiza_data_atualizacao();
