import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, ShoppingCart, Trash2, User } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { QuantitySelector } from '../../components/operations/QuantitySelector';
import { PinModal } from '../../components/operations/PinModal';
import { EpiBlockedModal } from '../../components/operations/EpiBlockedModal';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { funcionarioService } from '../../services/funcionarioService';
import { movimentacaoService } from '../../services/movimentacaoService';
import { OfflineQueueException } from '../../services/exceptions';
import type { ProdutoModel, FuncionarioModel, MovimentacaoModel } from '../../types/models';

interface ItemCarrinho {
  produto: ProdutoModel;
  quantidade: number;
  isConsumo: boolean;
  observacao: string;
}

interface SaidaScreenProps {
  onBack: () => void;
}

export const SaidaScreen: React.FC<SaidaScreenProps> = ({ onBack }) => {
  const { funcionario, session, empresaId, device } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const [funcionarios, setFuncionarios] = useState<FuncionarioModel[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<FuncionarioModel | null>(null);
  const [crachaBusca, setCrachaBusca] = useState<string>('');

  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [isConsumo, setIsConsumo] = useState<boolean>(false);
  const [observacao, setObservacao] = useState<string>('');

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // isLoadingData

  // Estados dos Modais
  const [modalEpiBlocked, setModalEpiBlocked] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [modalPinOpen, setModalPinOpen] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isValidatingPin, setIsValidatingPin] = useState<boolean>(false);

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!empId) return;
      setIsLoading(true);
      try {
        const [prods, funcs] = await Promise.all([
          produtoService.listarProdutos(empId),
          funcionarioService.listarFuncionarios(empId),
        ]);
        setProdutos(prods);
        setFuncionarios(funcs);
      } catch (err: any) {
        setMensagemErro(err.message || 'Falha ao carregar dados iniciais.');
      } finally {
        setIsLoading(false);
      }
    }
    carregar();
  }, [empId]);

  const handleBuscarPorCracha = async () => {
    if (!crachaBusca.trim()) return;
    try {
      const func = await funcionarioService.getFuncionarioByCracha(crachaBusca.trim(), empId);
      if (func) {
        setFuncionarioSelecionado(func);
        setMensagemErro(null);
      } else {
        setMensagemErro('Colaborador não encontrado com este crachá.');
      }
    } catch (_) {
      setMensagemErro('Erro ao buscar colaborador.');
    }
  };

  // Adicionar ao Carrinho com Trava RN-08
  const handleAdicionarAoCarrinho = () => {
    setMensagemErro(null);
    if (!funcionarioSelecionado) {
      setMensagemErro('Selecione primeiro o colaborador receptor.');
      return;
    }
    if (!produtoSelecionado) {
      setMensagemErro('Selecione um produto para adicionar.');
      return;
    }
    if (quantidade <= 0) {
      setMensagemErro('A quantidade deve ser maior que zero.');
      return;
    }

    // Calcular estoque disponível considerando o que já está no carrinho
    const qtdJaNoCarrinho = carrinho
      .filter((item) => item.produto.id === produtoSelecionado.id)
      .reduce((sum, item) => sum + item.quantidade, 0);

    if (quantidade + qtdJaNoCarrinho > produtoSelecionado.estoqueAtual) {
      setMensagemErro(
        `Estoque insuficiente: Saldo de ${produtoSelecionado.estoqueAtual} UN. Já no carrinho: ${qtdJaNoCarrinho} UN.`
      );
      return;
    }

    // REGRA RN-08: BLOQUEIO DE EPI COM CA VENCIDO
    if (produtoSelecionado.conformidade) {
      const conf = produtoSelecionado.conformidade;
      const bloqueia = conf.bloquear_vencido !== false;

      if (bloqueia) {
        const tipo = conf.tipo_controle || 'CA';
        const dataStr = tipo === 'CA' ? conf.data_validade : conf.data_proxima_afericao;

        if (conf.status_manual === 'BLOQUEADO') {
          setModalEpiBlocked({
            isOpen: true,
            title: `ATENÇÃO: ${produtoSelecionado.nome}`,
            message: 'Produto bloqueado manualmente pela engenharia de segurança.',
          });
          return;
        }

        if (dataStr) {
          const validade = new Date(dataStr);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          validade.setHours(0, 0, 0, 0);

          if (validade.getTime() < hoje.getTime()) {
            const dataFmt = `${validade.getDate().toString().padStart(2, '0')}/${(validade.getMonth() + 1).toString().padStart(2, '0')}/${validade.getFullYear()}`;
            setModalEpiBlocked({
              isOpen: true,
              title: `SAÍDA BLOQUEADA: ${produtoSelecionado.nome}`,
              message: `O controle de conformidade (${tipo}) deste EPI está vencido desde ${dataFmt}. Não é permitida a entrega.`,
            });
            return;
          }
        }
      }
    }

    // Adiciona ao carrinho
    setCarrinho((prev) => [
      ...prev,
      {
        produto: produtoSelecionado,
        quantidade,
        isConsumo,
        observacao,
      },
    ]);

    // Reseta seleção de produto
    setProdutoSelecionado(null);
    setQuantidade(1);
    setIsConsumo(false);
    setObservacao('');
  };

  const handleRemoverItem = (index: number) => {
    setCarrinho((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleIniciarFinalizacao = () => {
    if (carrinho.length === 0) {
      setMensagemErro('Adicione pelo menos um produto ao carrinho.');
      return;
    }
    if (!funcionarioSelecionado) {
      setMensagemErro('Selecione o colaborador receptor.');
      return;
    }
    setPinError(null);
    setModalPinOpen(true);
  };

  const handleConfirmarComPin = async (pinDigitado: string) => {
    if (!funcionarioSelecionado) return;
    setIsValidatingPin(true);
    setPinError(null);

    try {
      const validacao = await funcionarioService.validarSenhaMovimentacao(
        funcionarioSelecionado.id,
        pinDigitado
      );

      if (!validacao.success) {
        setPinError(validacao.message || 'Senha de movimentação incorreta.');
        setIsValidatingPin(false);
        return;
      }

      // Senha confirmada, fecha modal e executa a baixa no lote
      setModalPinOpen(false);
      setIsLoading(true);

      const currentUser = funcionario;
      let sucessoQtd = 0;

      for (const item of carrinho) {
        const mov: MovimentacaoModel = {
          produtoId: item.produto.id,
          funcionarioId: funcionarioSelecionado.id,
          prateleiraId: item.produto.prateleiraId,
          tipo: item.isConsumo ? 'CONSUMO' : 'SA',
          quantidade: item.quantidade,
          observacao: item.observacao,
          nomeProduto: item.produto.nome,
          nomeFuncionario: funcionarioSelecionado.nome,
          usuarioNome: currentUser?.nome,
          usuarioMatricula: currentUser?.cracha,
        };

        await movimentacaoService.registrarMovimentacao(
          mov,
          {
            empresaId: empId,
            funcionarioId: funcionarioSelecionado.id,
            funcionarioNome: funcionarioSelecionado.nome,
            funcionarioCracha: funcionarioSelecionado.cracha,
            deviceId: device.deviceId,
            appVersion: device.appVersion,
          },
          item.produto
        );
        sucessoQtd++;
      }

      setMensagemSucesso(`${sucessoQtd} produto(s) retirado(s) com sucesso!`);
      setCarrinho([]);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      if (err instanceof OfflineQueueException) {
        setMensagemSucesso('Dispositivo sem internet. Registros salvos offline e serão sincronizados automaticamente!');
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setMensagemErro(err.message || 'Erro ao registrar saídas.');
      }
    } finally {
      setIsValidatingPin(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Saída de Produto" showBack={true} onBack={onBack} />

      <main className="zoestock-content-scroll">
        <div className="operation-form">
          <div className="form-section-header">
            <h3>1. Dados do Colaborador Receptor</h3>
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

          {/* Busca por crachá e dropdown */}
          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o crachá do colaborador..."
              value={crachaBusca}
              onChange={(e) => setCrachaBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarPorCracha()}
            />
            <button
              type="button"
              className="btn-search-action"
              onClick={handleBuscarPorCracha}
            >
              Buscar
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <select
              className="select-input"
              value={funcionarioSelecionado?.id || ''}
              onChange={(e) => {
                const f = funcionarios.find((x) => x.id === e.target.value);
                setFuncionarioSelecionado(f || null);
              }}
            >
              <option value="">Ou selecione da lista de colaboradores...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.cracha} - {f.nome}
                </option>
              ))}
            </select>
          </div>

          {funcionarioSelecionado && (
            <div className="colaborador-card">
              <div className="colaborador-icon">
                <User size={24} color="#D32F2F" />
              </div>
              <div className="colaborador-body">
                <div className="colaborador-name">{funcionarioSelecionado.nome}</div>
                <div className="colaborador-meta">
                  <span>Crachá: {funcionarioSelecionado.cracha}</span>
                  {funcionarioSelecionado.departamento && (
                    <span> | {funcionarioSelecionado.departamento}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-section-header" style={{ marginTop: '24px' }}>
            <h3>2. Selecionar Produto para Saída</h3>
          </div>

          <div className="form-group">
            <label className="field-label">Produto *</label>
            <select
              className="select-input"
              value={produtoSelecionado?.id || ''}
              onChange={(e) => {
                const found = produtos.find((p) => p.id === e.target.value);
                setProdutoSelecionado(found || null);
              }}
            >
              <option value="">Selecione o produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} - ` : ''}{p.nome} (Estoque: {p.estoqueAtual})
                </option>
              ))}
            </select>
          </div>

          <QuantitySelector
            label="Quantidade Solicitada *"
            value={quantidade}
            max={produtoSelecionado ? produtoSelecionado.estoqueAtual : undefined}
            onChange={setQuantidade}
          />

          <div className="checkbox-group" style={{ marginTop: '12px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isConsumo}
                onChange={(e) => setIsConsumo(e.target.checked)}
              />
              <div className="checkbox-text">
                <strong>Produto para consumo?</strong>
                <span>Se marcado, não ficará como pendência na ficha do usuário.</span>
              </div>
            </label>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="field-label">Observação</label>
            <input
              type="text"
              className="text-input"
              placeholder="Opcional..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-add-cart"
            onClick={handleAdicionarAoCarrinho}
            disabled={!produtoSelecionado}
          >
            + Adicionar ao Carrinho de Saída
          </button>

          {/* Carrinho de Saída */}
          <div className="form-section-header" style={{ marginTop: '32px' }}>
            <div className="cart-header-title">
              <ShoppingCart size={20} color="#D32F2F" />
              <h3>Carrinho de Saída ({carrinho.length} itens)</h3>
            </div>
          </div>

          {carrinho.length === 0 ? (
            <div className="cart-empty-box">Nenhum produto adicionado ao carrinho ainda.</div>
          ) : (
            <div className="cart-items-list">
              {carrinho.map((item, idx) => (
                <div key={idx} className="cart-item-card">
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.produto.nome}</div>
                    <div className="cart-item-qty">
                      Quantidade: <strong>{item.quantidade} UN</strong>
                      {item.isConsumo && <span className="consumo-badge">Consumo</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => handleRemoverItem(idx)}
                    aria-label="Remover item"
                  >
                    <Trash2 size={18} color="#D32F2F" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botão Finalizar */}
          <button
            type="button"
            className="btn-primary-action red"
            onClick={handleIniciarFinalizacao}
            disabled={isLoading || carrinho.length === 0 || !funcionarioSelecionado}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Registrando...' : 'Confirmar Saída com Senha do Colaborador'}
          </button>
        </div>
      </main>

      {/* Modal de Bloqueio de EPI */}
      <EpiBlockedModal
        isOpen={modalEpiBlocked.isOpen}
        title={modalEpiBlocked.title}
        message={modalEpiBlocked.message}
        onClose={() => setModalEpiBlocked((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal de Assinatura por PIN */}
      <PinModal
        isOpen={modalPinOpen}
        colaboradorNome={funcionarioSelecionado?.nome || 'Colaborador'}
        isLoading={isValidatingPin}
        errorMessage={pinError}
        onConfirm={handleConfirmarComPin}
        onCancel={() => setModalPinOpen(false)}
      />
    </div>
  );
};
