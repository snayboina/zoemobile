import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { SearchableSelect, type SearchableOption } from '../../components/common/SearchableSelect';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { prateleiraService } from '../../services/prateleiraService';
import { inventarioService } from '../../services/inventarioService';
import { movimentacaoService } from '../../services/movimentacaoService';
import type { ProdutoModel, PrateleiraModel, MovimentacaoModel } from '../../types/models';

interface InventarioScreenProps {
  onBack: () => void;
}

export const InventarioScreen: React.FC<InventarioScreenProps> = ({ onBack }) => {
  const { funcionario, session, empresaId, device } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

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
      label: prat.codigoLocalizacao,
      sublabel: prat.zona ? `Zona: ${prat.zona}` : undefined,
      badge: {
        text: prat.zona ? `Zona ${prat.zona}` : 'Depósito',
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

      // 1. Registra o inventário físico
      await inventarioService.registrarInventario(
        {
          produtoId: produtoSelecionado.id,
          usuarioId: currentUser?.id,
          quantidadeSistema: produtoSelecionado.estoqueAtual,
          quantidadeReal: quantidadeReal,
          diferenca: diferenca,
          observacao: observacao.trim() || 'Inventário Mobile PWA',
        },
        empId
      );

      // 2. Se houver divergência ou transferência, registra ajuste de movimentação
      if (diferenca !== 0) {
        const tipoAjuste = diferenca > 0 ? 'EN' : 'SA';
        const qtdAjuste = Math.abs(diferenca);

        const movAjuste: MovimentacaoModel = {
          produtoId: produtoSelecionado.id,
          funcionarioId: currentUser?.id,
          prateleiraId: mudarPrateleira && prateleiraDestino ? prateleiraDestino.id : produtoSelecionado.prateleiraId,
          tipo: tipoAjuste,
          quantidade: qtdAjuste,
          tipoEntrada: 'INVENTARIO',
          observacao: `Ajuste de Inventário: Divergência de ${diferenca > 0 ? '+' : ''}${diferenca} UN`,
          nomeProduto: produtoSelecionado.nome,
          nomeFuncionario: currentUser?.nome,
          usuarioNome: currentUser?.nome,
          usuarioMatricula: currentUser?.cracha,
        };

        await movimentacaoService.registrarMovimentacao(
          movAjuste,
          {
            empresaId: empId,
            funcionarioId: currentUser?.id,
            funcionarioNome: currentUser?.nome,
            funcionarioCracha: currentUser?.cracha,
            deviceId: device.deviceId,
            appVersion: device.appVersion,
          },
          produtoSelecionado
        );
      }

      setMensagemSucesso('Contagem de inventário e ajuste registrados com sucesso!');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao registrar inventário.');
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
                value={prateleiraDestino?.id || ''}
                onChange={(selectedId) => {
                  const prat = prateleiras.find((p) => p.id === selectedId);
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
    </div>
  );
};
