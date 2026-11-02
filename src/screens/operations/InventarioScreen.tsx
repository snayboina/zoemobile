import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { SearchableSelect, type SearchableOption } from '../../components/common/SearchableSelect';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { prateleiraService } from '../../services/prateleiraService';
import { inventarioService } from '../../services/inventarioService';
import { supabase } from '../../services/supabase/client';
import { StorageAdapter } from '../../services/offline/storageAdapter';
import { FeedbackModal, type FeedbackDetail } from '../../components/common/FeedbackModal';
import type { ProdutoModel, PrateleiraModel } from '../../types/models';

interface InventarioScreenProps {
  onBack: () => void;
}

export const InventarioScreen: React.FC<InventarioScreenProps> = ({ onBack }) => {
  const { funcionario, session, empresaId } = useAuthStore();
  const [empresaAtivaId, setEmpresaAtivaId] = useState<string>(
    empresaId || session?.empresaId || (session as any)?.empresa_id || funcionario?.empresa_id || ''
  );
  const empId = empresaAtivaId || empresaId || session?.empresaId || (session as any)?.empresa_id || funcionario?.empresa_id || '';

  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [prateleiras, setPrateleiras] = useState<PrateleiraModel[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);
  const [quantidadeReal, setQuantidadeReal] = useState<number>(0);
  const [observacao, setObservacao] = useState<string>('');

  const [mudarPrateleira, setMudarPrateleira] = useState<boolean>(false);
  const [prateleiraDestino, setPrateleiraDestino] = useState<PrateleiraModel | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const [modalFeedback, setModalFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    description: string;
    details?: FeedbackDetail[];
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    description: '',
  });

  useEffect(() => {
    if (!empId) {
      StorageAdapter.getItem('auth_empresa_id').then((savedId) => {
        if (savedId && savedId.trim() !== '') {
          setEmpresaAtivaId(savedId.trim());
        }
      });
    }
  }, [empId]);

  useEffect(() => {
    async function carregar() {
      try {
        const [prods, prats] = await Promise.all([
          produtoService.listarProdutos(empId),
          prateleiraService.listarPrateleiras(empId),
        ]);
        setProdutos(prods);
        setPrateleiras(prats);
      } catch (_) {}
    }
    carregar();
  }, [empId]);

  const produtoOptions: SearchableOption[] = useMemo(() => {
    return produtos.map((p) => {
      const extraBadges: Array<{ text: string; variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = [];

      return {
        value: p.id,
        label: p.nome,
        code: p.codigo ? p.codigo : undefined,
        sublabel: p.categoria || undefined,
        type: 'produto' as const,
        badge: {
          text: `Estoque Sistema: ${p.estoqueAtual ?? 0} UN`,
          variant: (p.estoqueAtual ?? 0) <= 0 ? 'danger' : 'neutral',
        },
        extraBadges,
      };
    });
  }, [produtos]);

  const prateleiraOptions: SearchableOption[] = useMemo(() => {
    return prateleiras.map((prat) => ({
      value: prat.id || prat.codigoLocalizacao,
      label: `Prateleira ${prat.codigoLocalizacao}`,
      code: prat.codigoLocalizacao,
      sublabel: prat.zona ? `Zona: ${prat.zona}` : undefined,
      type: 'default' as const,
      badge: {
        text: prat.zona ? prat.zona : 'Depósito',
        variant: 'neutral' as const,
      },
    }));
  }, [prateleiras]);

  const diferenca = produtoSelecionado ? quantidadeReal - produtoSelecionado.estoqueAtual : 0;

  const handleSalvarInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!produtoSelecionado) {
      setMensagemErro('Selecione um produto.');
      return;
    }
    if (quantidadeReal < 0) {
      setMensagemErro('A quantidade física não pode ser negativa.');
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = funcionario;
      const empresaEfetiva = produtoSelecionado.empresa_id || empId;

      const isValidUuid = (v?: string | null): boolean => {
        if (!v) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
      };

      const normalizarCodigo = (c: string) =>
        c.replace(/prateleira\s*/i, '').replace(/prat\.?\s*/i, '').trim().toLowerCase();

      // 1. Resolver Prateleira de Origem
      let prateleiraOrigemUuid: string | null = null;
      let prateleiraOrigemCodigo: string = '';
      const rawOrigem = produtoSelecionado.prateleiraId || produtoSelecionado.prateleira_id;
      if (rawOrigem) {
        if (isValidUuid(rawOrigem)) {
          prateleiraOrigemUuid = rawOrigem;
          const found = prateleiras.find((p) => p.id?.toLowerCase() === rawOrigem.toLowerCase());
          if (found) prateleiraOrigemCodigo = found.codigoLocalizacao || '';
        } else {
          prateleiraOrigemCodigo = rawOrigem;
          const found = prateleiras.find(
            (p) =>
              p.id?.toLowerCase() === rawOrigem.toLowerCase() ||
              normalizarCodigo(p.codigoLocalizacao || '') === normalizarCodigo(rawOrigem) ||
              (p.codigoLocalizacao && rawOrigem.toLowerCase().includes(p.codigoLocalizacao.toLowerCase()))
          );
          if (found && isValidUuid(found.id)) {
            prateleiraOrigemUuid = found.id || null;
            prateleiraOrigemCodigo = found.codigoLocalizacao || '';
          }
        }
      }

      // Se ainda não resolveu a origem pelo produto, buscar onde há saldo em estoque_atual
      if (!prateleiraOrigemUuid && produtoSelecionado.id) {
        try {
          const { data: estRow } = await supabase
            .from('estoque_atual')
            .select('prateleira_id')
            .eq('produto_id', produtoSelecionado.id)
            .gt('quantidade', 0)
            .limit(1)
            .maybeSingle();

          if (estRow && isValidUuid(estRow.prateleira_id)) {
            prateleiraOrigemUuid = estRow.prateleira_id || null;
            const found = prateleiras.find((p) => p.id?.toLowerCase() === (estRow.prateleira_id || '').toLowerCase());
            if (found) prateleiraOrigemCodigo = found.codigoLocalizacao || '';
          }
        } catch (_) {}
      }

      // 2. Resolver Prateleira de Destino (se marcou transferência)
      let prateleiraDestinoUuid: string | null = null;
      let prateleiraDestinoCodigo: string = '';
      if (mudarPrateleira && prateleiraDestino) {
        prateleiraDestinoCodigo = prateleiraDestino.codigoLocalizacao;
        if (isValidUuid(prateleiraDestino.id)) {
          prateleiraDestinoUuid = prateleiraDestino.id || null;
        } else {
          const match = prateleiras.find(
            (p) =>
              p.id === prateleiraDestino.id ||
              normalizarCodigo(p.codigoLocalizacao || '') === normalizarCodigo(prateleiraDestino.codigoLocalizacao || '')
          );
          if (match && isValidUuid(match.id)) {
            prateleiraDestinoUuid = match.id || null;
            prateleiraDestinoCodigo = match.codigoLocalizacao;
          }
        }
      }

      // Prateleira final do inventário (destino se marcou mudança, senão origem)
      const prateleiraFinalUuid = (mudarPrateleira && prateleiraDestinoUuid) ? prateleiraDestinoUuid : prateleiraOrigemUuid;

      // 3. Registra o inventário físico
      await inventarioService.registrarInventario(
        {
          produtoId: produtoSelecionado.id,
          prateleiraId: prateleiraFinalUuid,
          usuarioId: currentUser?.id,
          quantidadeSistema: produtoSelecionado.estoqueAtual,
          quantidadeReal: quantidadeReal,
          diferenca: diferenca,
          observacao: observacao.trim() || 'Inventário Mobile PWA',
        },
        empresaEfetiva
      );

      const mudouDePrateleira = Boolean(
        mudarPrateleira &&
        prateleiraDestinoUuid &&
        (
          prateleiraDestinoUuid !== prateleiraOrigemUuid ||
          (prateleiraOrigemCodigo && prateleiraDestinoCodigo && normalizarCodigo(prateleiraOrigemCodigo) !== normalizarCodigo(prateleiraDestinoCodigo))
        )
      );

      if (mudouDePrateleira && prateleiraDestinoUuid) {
        let transferiuViaRpc = false;
        let rpcErroMensagem = '';

        // 1. Tentar transferir via RPC segura atômica (Script 128)
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('transferir_prateleira_inventario', {
            p_produto_id: produtoSelecionado.id,
            p_prateleira_destino_id: prateleiraDestinoUuid,
            p_quantidade_fisica: quantidadeReal,
            p_empresa_id: empresaEfetiva,
            p_usuario_nome: currentUser?.nome || 'Operador',
            p_usuario_matricula: currentUser?.cracha || null,
            p_observacao: observacao.trim() || 'Transferência via Inventário Mobile',
          });

          if (!rpcErr && rpcRes && rpcRes.success) {
            transferiuViaRpc = true;
          } else {
            rpcErroMensagem = rpcErr?.message || rpcRes?.message || 'RPC não disponível no Supabase';
            console.warn('[Inventario] RPC transferir_prateleira_inventario falhou ou ausente:', rpcErr || rpcRes);
          }
        } catch (e: any) {
          rpcErroMensagem = e?.message || 'Falha ao invocar RPC';
          console.warn('[Inventario] Exceção na RPC transferir_prateleira_inventario:', e);
        }

        // 2. Se a RPC não foi executada, aplicar fallback direto e seguro em estoque_atual
        if (!transferiuViaRpc) {
          let sucessoEstoque = false;
          let erroGravacaoEstoque = '';

          try {
            // Buscar registros atuais de estoque_atual para este produto
            const { data: estRows, error: estFetchErr } = await supabase
              .from('estoque_atual')
              .select('id, prateleira_id, quantidade')
              .eq('produto_id', produtoSelecionado.id);

            if (estFetchErr) {
              erroGravacaoEstoque = estFetchErr.message;
            } else if (estRows && estRows.length > 0) {
              const destinoRow = estRows.find((r: any) => r.prateleira_id === prateleiraDestinoUuid);

              if (destinoRow) {
                // Atualizar quantidade na prateleira destino já existente
                const { error: updErr } = await supabase
                  .from('estoque_atual')
                  .update({ quantidade: quantidadeReal, updated_at: new Date().toISOString() })
                  .eq('id', destinoRow.id);

                if (updErr) erroGravacaoEstoque = updErr.message;
                else sucessoEstoque = true;

                // Zerar outras prateleiras
                const outrosIds = estRows.filter((r: any) => r.id !== destinoRow.id).map((r: any) => r.id);
                if (outrosIds.length > 0) {
                  await supabase.from('estoque_atual').update({ quantidade: 0 }).in('id', outrosIds);
                }
              } else {
                // Tenta atualizar a linha anterior para apontar para a nova prateleira
                const { error: updPratErr } = await supabase
                  .from('estoque_atual')
                  .update({
                    prateleira_id: prateleiraDestinoUuid,
                    quantidade: quantidadeReal,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', estRows[0].id);

                if (updPratErr) {
                  // Se update de prateleira falhar por constraint, tenta insert
                  const { error: insErr } = await supabase.from('estoque_atual').insert({
                    produto_id: produtoSelecionado.id,
                    prateleira_id: prateleiraDestinoUuid,
                    quantidade: quantidadeReal,
                    empresa_id: empresaEfetiva,
                  });
                  if (insErr) erroGravacaoEstoque = insErr.message;
                  else {
                    sucessoEstoque = true;
                    await supabase.from('estoque_atual').update({ quantidade: 0 }).eq('id', estRows[0].id);
                  }
                } else {
                  sucessoEstoque = true;
                }

                if (estRows.length > 1) {
                  const outrosIds = estRows.slice(1).map((r: any) => r.id);
                  await supabase.from('estoque_atual').update({ quantidade: 0 }).in('id', outrosIds);
                }
              }
            } else {
              // Produto ainda não tinha registro em estoque_atual: insere novo
              const { error: insNovoErr } = await supabase.from('estoque_atual').insert({
                produto_id: produtoSelecionado.id,
                prateleira_id: prateleiraDestinoUuid,
                quantidade: quantidadeReal,
                empresa_id: empresaEfetiva,
              });
              if (insNovoErr) erroGravacaoEstoque = insNovoErr.message;
              else sucessoEstoque = true;
            }
          } catch (e: any) {
            erroGravacaoEstoque = e?.message || 'Falha ao gravar estoque_atual';
            console.error('[Inventario] Erro no fallback de estoque_atual:', e);
          }

          // Registrar histórico de movimentação (sem travar se trigger falhar)
          try {
            await supabase.from('movimentacoes').insert({
              tipo: 'EN',
              produto_id: produtoSelecionado.id,
              prateleira_id: prateleiraDestinoUuid,
              quantidade: quantidadeReal,
              tipo_entrada: 'TRANSFERENCIA',
              observacao: `Transferência de inventário para Prateleira ${prateleiraDestinoCodigo || 'nova'} (Saldo: ${quantidadeReal} UN)`,
              empresa_id: empresaEfetiva,
              usuario_nome: currentUser?.nome,
              usuario_matricula: currentUser?.cracha,
            });
          } catch (e) {
            console.warn('[Inventario] Aviso ao registrar histórico de movimentação:', e);
          }

          // Se nem a RPC nem o fallback conseguiram gravar no estoque_atual, LANÇAR ERRO EXPLÍCITO!
          if (!sucessoEstoque) {
            throw new Error(
              `Não foi possível gravar a mudança de prateleira no banco de dados. Execute o Script 128 no Supabase SQL Editor para autorizar a gravação. Detalhes: ${erroGravacaoEstoque || rpcErroMensagem}`
            );
          }
        }

        // 3. Atualizar cache local do produto para refletir imediatamente na tela
        try {
          const prodsAtualizados = produtos.map((p) => {
            if (p.id === produtoSelecionado.id) {
              return {
                ...p,
                estoqueAtual: quantidadeReal,
                estoque_atual: quantidadeReal,
                prateleiraId: prateleiraDestinoUuid,
                prateleira_id: prateleiraDestinoUuid,
              };
            }
            return p;
          });
          setProdutos(prodsAtualizados);
          setProdutoSelecionado((prev) =>
            prev ? { ...prev, estoqueAtual: quantidadeReal, estoque_atual: quantidadeReal, prateleiraId: prateleiraDestinoUuid, prateleira_id: prateleiraDestinoUuid } : null
          );
        } catch (_) {}

        // 4. Disparar Popup Moderno de Sucesso APENAS se confirmada a gravação
        setModalFeedback({
          isOpen: true,
          type: 'success',
          title: 'Transferência Concluída!',
          description: `O item foi transferido com sucesso para a Prateleira ${prateleiraDestinoCodigo || 'nova'}.`,
          details: [
            { label: 'Produto', value: produtoSelecionado.nome },
            { label: 'Saldo Atualizado', value: `${quantidadeReal} UN` },
            { label: 'Nova Localização', value: `Prateleira ${prateleiraDestinoCodigo || 'Destino'}` },
            ...(diferenca !== 0
              ? [{ label: 'Ajuste de Diferença', value: `${diferenca > 0 ? '+' : ''}${diferenca} UN` }]
              : [{ label: 'Conferência Física', value: '100% Batendo' }]),
          ],
          onConfirm: () => {
            setModalFeedback((prev) => ({ ...prev, isOpen: false }));
            onBack();
          },
        });
      } else {
        // NÃO mudou de prateleira: registra ajuste caso exista divergência
        if (diferenca !== 0) {
          const tipoAjuste = diferenca > 0 ? 'EN' : 'SA';
          const qtdAjuste = Math.abs(diferenca);

          try {
            await supabase.from('movimentacoes').insert({
              tipo: tipoAjuste,
              produto_id: produtoSelecionado.id,
              prateleira_id: prateleiraFinalUuid,
              quantidade: qtdAjuste,
              tipo_entrada: 'AJUSTE',
              observacao: `Ajuste de Inventário: Divergência de ${diferenca > 0 ? '+' : ''}${diferenca} UN`,
              empresa_id: empresaEfetiva,
              usuario_nome: currentUser?.nome,
              usuario_matricula: currentUser?.cracha,
            });
          } catch (e) {
            console.warn('[Inventario] Aviso no registro de movimentação de ajuste:', e);
          }

          try {
            await supabase
              .from('estoque_atual')
              .update({ quantidade: quantidadeReal, updated_at: new Date().toISOString() })
              .eq('produto_id', produtoSelecionado.id);
          } catch (_) {}
        }

        // Disparar Popup Moderno de Sucesso
        setModalFeedback({
          isOpen: true,
          type: 'success',
          title: 'Inventário Registrado!',
          description: 'A contagem física foi salva e sincronizada com sucesso no sistema.',
          details: [
            { label: 'Produto', value: produtoSelecionado.nome },
            { label: 'Quantidade Apurada', value: `${quantidadeReal} UN` },
            {
              label: 'Localização',
              value: prateleiraOrigemCodigo ? `Prateleira ${prateleiraOrigemCodigo}` : 'Almoxarifado',
            },
            {
              label: 'Divergência',
              value: diferenca === 0 ? '0 UN (Sem divergência)' : `${diferenca > 0 ? '+' : ''}${diferenca} UN`,
            },
          ],
          onConfirm: () => {
            setModalFeedback((prev) => ({ ...prev, isOpen: false }));
            onBack();
          },
        });
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao registrar inventário.';
      setMensagemErro(msg);
      setModalFeedback({
        isOpen: true,
        type: 'error',
        title: 'Não foi possível salvar',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Inventário Físico" showBack={true} onBack={onBack} />

      <main className="zoestock-content-scroll">
        <form onSubmit={handleSalvarInventario} className="operation-form">
          <div className="form-section-header">
            <h3>Contagem e Conferência</h3>
          </div>

          {mensagemErro && (
            <div className="alert-box error">
              <AlertCircle size={18} />
              <span>{mensagemErro}</span>
            </div>
          )}

          {mensagemSucesso && (
            <div className="alert-box success">
              <CheckCircle2 size={18} />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          <div className="form-group">
            <label className="field-label">Selecione o Produto *</label>
            <SearchableSelect
              title="Selecione o Produto"
              placeholder="Selecione o produto para inventário"
              searchPlaceholder="Pesquisar por nome, código ou localização..."
              emptyMessage="Nenhum produto encontrado com este termo."
              options={produtoOptions}
              value={produtoSelecionado?.id || ''}
              onChange={(selectedId) => {
                const found = produtos.find((p) => p.id === selectedId);
                setProdutoSelecionado(found || null);
                if (found) setQuantidadeReal(found.estoqueAtual);
              }}
              required
            />
          </div>

          {produtoSelecionado && (
            <div className="inventario-card-divergencia">
              <div className="divergencia-row">
                <div className="divergencia-item">
                  <span className="divergencia-label">ESTOQUE SISTEMA</span>
                  <span className="divergencia-value">{produtoSelecionado.estoqueAtual} UN</span>
                </div>
                <div className="divergencia-item">
                  <span className="divergencia-label">DIVERGÊNCIA</span>
                  <span className={`divergencia-value ${diferenca === 0 ? 'neutral' : diferenca > 0 ? 'green' : 'red'}`}>
                    {diferenca > 0 ? `+${diferenca}` : diferenca} UN
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="field-label">Quantidade Física Apurada *</label>
            <input
              type="number"
              className="text-input"
              value={quantidadeReal}
              min={0}
              onChange={(e) => setQuantidadeReal(parseInt(e.target.value, 10) || 0)}
              required
            />
          </div>

          {/* Mudança de Prateleira */}
          <div className="checkbox-group" style={{ marginTop: '10px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mudarPrateleira}
                onChange={(e) => setMudarPrateleira(e.target.checked)}
              />
              <div className="checkbox-text">
                <strong>Transferir para nova prateleira?</strong>
                <span>Altera a localização física do item no depósito.</span>
              </div>
            </label>
          </div>

          {mudarPrateleira && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="field-label">Prateleira Destino</label>
              <SearchableSelect
                title="Selecione a Prateleira Destino"
                placeholder="Selecione a prateleira destino..."
                searchPlaceholder="Pesquisar por código ou zona..."
                emptyMessage="Nenhuma prateleira encontrada."
                options={prateleiraOptions}
                value={prateleiraDestino?.id || prateleiraDestino?.codigoLocalizacao || ''}
                onChange={(selectedId) => {
                  const prat = prateleiras.find(
                    (p) => p.id === selectedId || p.codigoLocalizacao === selectedId
                  );
                  setPrateleiraDestino(prat || null);
                }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="field-label">Observação</label>
            <input
              type="text"
              className="text-input"
              placeholder="Ex: Auditoria semestral, contagem periódica..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary-action purple"
            disabled={isLoading || !produtoSelecionado}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Registrando...' : 'Salvar Contagem de Inventário'}
          </button>
        </form>
      </main>

      <FeedbackModal
        isOpen={modalFeedback.isOpen}
        type={modalFeedback.type}
        title={modalFeedback.title}
        description={modalFeedback.description}
        details={modalFeedback.details}
        primaryButtonText={modalFeedback.type === 'success' ? 'Concluir e Voltar' : 'Tentar Novamente'}
        onClose={() => {
          if (modalFeedback.type === 'success' && modalFeedback.onConfirm) {
            modalFeedback.onConfirm();
          } else {
            setModalFeedback((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      />
    </div>
  );
};
