-- Tabela de ordens de serviço
CREATE TABLE ordens (
    id SERIAL PRIMARY KEY,                  -- ID único da ordem
    professor_id INT NOT NULL,              -- FK para o professor
    titulo VARCHAR(255) NOT NULL,           -- Título da ordem
    descricao TEXT,                         -- Descrição detalhada
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | in-progress | done
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (professor_id) REFERENCES users(id)
);

-- Opcional: trigger para atualizar a data de atualização automaticamente
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
