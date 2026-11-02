-- =========================================================================
-- SCRIPT 127: RPC PARA OBTER ITENS EM POSSE DO COLABORADOR (NÃO-CONSUMO)
-- Sistema: ZoeStock / StockAngel
-- Objetivo: Listar de forma ultrarrápida, atômica e imune a restrições de RLS
--           todos os equipamentos, ferramentas e EPIs que estão sob responsabilidade
--           do funcionário (Saldo líquido de SA menos DV, ignorando itens de consumo).
-- =========================================================================

-- 1. Garantir permissões de leitura nas tabelas para API
GRANT SELECT ON TABLE public.movimentacoes TO anon, authenticated;
GRANT SELECT ON TABLE public.produtos TO anon, authenticated;

-- 2. Criar a RPC segura com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.obter_itens_posse_colaborador(
  p_funcionario_id UUID,
  p_empresa_id UUID DEFAULT NULL
)
RETURNS TABLE (
  produto_id UUID,
  nome TEXT,
  saldo_pendente NUMERIC,
  categoria TEXT,
  ca_numero TEXT,
  consumo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.produto_id,
    COALESCE(p.nome, 'Produto não identificado')::TEXT AS nome,
    SUM(CASE WHEN m.tipo = 'SA' THEN m.quantidade ELSE -m.quantidade END)::NUMERIC AS saldo_pendente,
    COALESCE(p.categoria, '')::TEXT AS categoria,
    COALESCE(p.ca_numero, '')::TEXT AS ca_numero,
    COALESCE(p.consumo, false)::BOOLEAN AS consumo
  FROM public.movimentacoes m
  LEFT JOIN public.produtos p ON p.id = m.produto_id
  WHERE m.funcionario_id = p_funcionario_id
    AND m.tipo IN ('SA', 'DV')
    AND (p_empresa_id IS NULL OR m.empresa_id = p_empresa_id)
    AND COALESCE(p.consumo, false) = false
  GROUP BY m.produto_id, p.nome, p.categoria, p.ca_numero, p.consumo
  HAVING SUM(CASE WHEN m.tipo = 'SA' THEN m.quantidade ELSE -m.quantidade END) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. Conceder permissão de execução para a API
GRANT EXECUTE ON FUNCTION public.obter_itens_posse_colaborador(UUID, UUID) TO anon, authenticated;

-- 4. Recarregar o cache de schemas do PostgREST
NOTIFY pgrst, 'reload schema';
