-- ==============================================================================
-- SCRIPT 129: GARANTIR REGISTRO E LEITURA DO RESPONSÁVEL LOGADO NAS MOVIMENTAÇÕES
-- Sistema: ZoeStock / StockAngel
-- Objetivo:
--   1. Garantir que a tabela public.movimentacoes possua as colunas usuario_nome e usuario_matricula.
--   2. Atualizar a view public.view_historico_movimentacoes para expor usuario_nome e usuario_matricula.
--   3. Atualizar a RPC public.listar_movimentacoes_empresa para incluir usuario_nome e usuario_matricula.
-- ==============================================================================

-- 1. ADICIONAR COLUNAS CASO NÃO EXISTAM NA TABELA
ALTER TABLE public.movimentacoes 
ADD COLUMN IF NOT EXISTS usuario_nome TEXT;

ALTER TABLE public.movimentacoes 
ADD COLUMN IF NOT EXISTS usuario_matricula TEXT;

-- 2. RECRIAR A VIEW HISTÓRICO COM OS CAMPOS DO OPERADOR RESPONSÁVEL
DROP VIEW IF EXISTS public.view_historico_movimentacoes CASCADE;

CREATE OR REPLACE VIEW public.view_historico_movimentacoes AS
SELECT 
    m.id,
    m.created_at AS data_hora,
    CASE 
        WHEN m.tipo = 'EN' THEN 'ENTRADA'
        WHEN m.tipo = 'SA' THEN 'SAÍDA'
        WHEN m.tipo = 'DV' THEN 'DEVOLUÇÃO'
        WHEN m.tipo = 'CONSUMO' THEN 'CONSUMO'
        ELSE m.tipo
    END AS operacao,
    m.tipo,
    COALESCE(p.nome, 'Produto não identificado') AS produto,
    m.produto_id,
    p.codigo_barras,
    m.funcionario_id,
    COALESCE(f.nome, 'Não informado') AS funcionario,
    f.cracha AS funcionario_cracha,
    m.quantidade,
    COALESCE(pr.codigo_localizacao, 'Estoque Geral') AS local,
    m.prateleira_id,
    m.tipo_entrada,
    m.observacao,
    m.empresa_id,
    m.usuario_nome,
    m.usuario_matricula,
    m.device_id,
    m.app_version,
    m.os_platform
FROM public.movimentacoes m
LEFT JOIN public.produtos p ON m.produto_id = p.id
LEFT JOIN public.funcionarios f ON m.funcionario_id = f.id
LEFT JOIN public.prateleiras pr ON m.prateleira_id = pr.id
WHERE (m.excluido IS NULL OR m.excluido = false) 
  AND (p.excluido IS NULL OR p.excluido = false)
ORDER BY m.created_at DESC;

-- Permissões na view
GRANT SELECT ON TABLE public.view_historico_movimentacoes TO anon, authenticated;

-- 3. ATUALIZAR RPC listar_movimentacoes_empresa COM O USUÁRIO LOGADO
DROP FUNCTION IF EXISTS public.listar_movimentacoes_empresa(UUID, INT);
DROP FUNCTION IF EXISTS public.listar_movimentacoes_empresa(UUID, UUID, INT);

CREATE OR REPLACE FUNCTION public.listar_movimentacoes_empresa(
  p_empresa_id UUID,
  p_produto_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  produto_id UUID,
  funcionario_id UUID,
  tipo TEXT,
  quantidade NUMERIC,
  prateleira_id UUID,
  created_at TIMESTAMPTZ,
  funcionario_nome TEXT,
  usuario_nome TEXT,
  usuario_matricula TEXT,
  observacao TEXT
) AS $$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'O ID da empresa é obrigatório para consultar movimentações.';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.produto_id,
    m.funcionario_id,
    m.tipo,
    m.quantidade::NUMERIC,
    m.prateleira_id,
    m.created_at,
    COALESCE(f.nome, '') AS funcionario_nome,
    m.usuario_nome,
    m.usuario_matricula,
    m.observacao
  FROM public.movimentacoes m
  LEFT JOIN public.funcionarios f ON f.id = m.funcionario_id
  WHERE m.empresa_id = p_empresa_id
    AND (p_produto_id IS NULL OR m.produto_id = p_produto_id)
    AND COALESCE(m.excluido, false) = false
  ORDER BY m.created_at DESC
  LIMIT COALESCE(p_limit, 200);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.listar_movimentacoes_empresa(UUID, UUID, INT) TO anon, authenticated;

-- Recarregar cache de schemas do Supabase
NOTIFY pgrst, 'reload schema';

