import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { QuantitySelector } from '../../components/operations/QuantitySelector';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { movimentacaoService } from '../../services/movimentacaoService';
import { OfflineQueueException } from '../../services/exceptions';
import type { ProdutoModel, MovimentacaoModel } from '../../types/models';

interface EntradaScreenProps {
  onBack: () => void;
}

export const EntradaScreen: React.FC<EntradaScreenProps> = ({ onBack }) => {
  const { funcionario, session, empresaId, device } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>('');
  const [isInventario, setIsInventario] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState<boolean>(true);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setIsLoadingProdutos(true);
      try {
        const lista = await produtoService.listarProdutos(empId);
        setProdutos(lista);
      } catch (err: any) {
        setMensagemErro(err.message || 'Falha ao carregar lista de produtos.');
      } finally {
        setIsLoadingProdutos(false);
      }
    }
    carregar();
  }, [empId]);

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!produtoSelecionado) {
      setMensagemErro('Selecione um produto para realizar a entrada.');
      return;
    }
    if (quantidade <= 0) {
      setMensagemErro('A quantidade deve ser maior que zero.');
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = funcionario;
      const observacaoFinal = isInventario
        ? `${observacao.trim()} (Ajuste de Inventário)`.trim()
        : observacao.trim();

      const mov: MovimentacaoModel = {
        produtoId: produtoSelecionado.id,
        funcionarioId: currentUser?.id,
        prateleiraId: produtoSelecionado.prateleiraId,
        tipo: 'EN',
        quantidade: quantidade,
        observacao: observacaoFinal,
        nomeProduto: produtoSelecionado.nome,
        nomeFuncionario: currentUser?.nome,
        usuarioNome: currentUser?.nome,
        usuarioMatricula: currentUser?.cracha,
      };

      await movimentacaoService.registrarMovimentacao(
        mov,
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

      setMensagemSucesso('Entrada registrada com sucesso no estoque!');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      if (err instanceof OfflineQueueException) {
        setMensagemSucesso('Dispositivo sem internet. Registro salvo offline e será sincronizado automaticamente!');
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setMensagemErro(err.message || 'Erro ao registrar entrada.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Entrada de Produto" showBack={true} onBack={onBack} />

      <main className="zoestock-content-scroll">
        <form onSubmit={handleConfirmar} className="operation-form">
          <div className="form-section-header">
            <h3>Dados do Produto</h3>
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

          {/* Seleção do Produto */}
          <div className="form-group">
            <label className="field-label">Selecione o Produto *</label>
            {isLoadingProdutos ? (
              <div className="loading-placeholder">Carregando produtos...</div>
            ) : (
              <select
                className="select-input"
                value={produtoSelecionado?.id || ''}
                onChange={(e) => {
                  const found = produtos.find((p) => p.id === e.target.value);
                  setProdutoSelecionado(found || null);
                }}
                required
              >
                <option value="">Selecione o produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `${p.codigo} - ` : ''}{p.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Detalhes do Produto Selecionado */}
          {produtoSelecionado && (
            <div className="produto-info-card">
              <div className="produto-info-icon">
                <Package size={24} color="#1976D2" />
              </div>
              <div className="produto-info-body">
                <div className="produto-info-name">{produtoSelecionado.nome}</div>
                <div className="produto-info-meta">
                  <span>Estoque Atual: <strong>{produtoSelecionado.estoqueAtual}</strong></span>
                  {produtoSelecionado.caNumero && (
                    <span> | CA: {produtoSelecionado.caNumero}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <h3>Detalhes da Entrada</h3>
          </div>

          {/* Seletor de Quantidade */}
          <QuantitySelector
            label="Quantidade de entrada *"
            value={quantidade}
            onChange={setQuantidade}
          />

          {/* Observação */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="field-label">Observação (Opcional)</label>
            <input
              type="text"
              className="text-input"
              placeholder="Ex: Nota Fiscal nº 1234, fornecedor..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          {/* Checkbox Inventário */}
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isInventario}
                onChange={(e) => setIsInventario(e.target.checked)}
              />
              <div className="checkbox-text">
                <strong>Entrada de Inventário?</strong>
                <span>Marque se for um ajuste ou contagem física de estoque.</span>
              </div>
            </label>
          </div>

          {/* Projeção de Estoque */}
          {produtoSelecionado && (
            <div className="stock-projection-card">
              <div className="projection-col">
                <span className="projection-label">ESTOQUE ATUAL</span>
                <span className="projection-value">{produtoSelecionado.estoqueAtual} UN</span>
              </div>
              <ArrowRight size={24} color="#888888" />
              <div className="projection-col">
                <span className="projection-label">ESTOQUE APÓS ENTRADA</span>
                <span className="projection-value green">
                  {produtoSelecionado.estoqueAtual + quantidade} UN
                </span>
              </div>
            </div>
          )}

          {/* Botão de Confirmação */}
          <button
            type="submit"
            className="btn-primary-action green"
            disabled={isLoading || !produtoSelecionado}
          >
            {isLoading ? 'Registrando Entrada...' : 'Confirmar Entrada'}
          </button>
        </form>
      </main>
    </div>
  );
};
