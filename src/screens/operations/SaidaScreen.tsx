import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Trash2,
  User,
  Package,
  Search,
  QrCode,
} from 'lucide-react';
import { Header } from '../../components/common/Header';
import { QuantitySelector } from '../../components/operations/QuantitySelector';
import { PinModal } from '../../components/operations/PinModal';
import { EpiBlockedModal } from '../../components/operations/EpiBlockedModal';
import { QrCodeScannerModal } from '../../components/common/QrCodeScannerModal';
import { SearchableSelect, type SearchableOption } from '../../components/common/SearchableSelect';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { funcionarioService } from '../../services/funcionarioService';
import { movimentacaoService } from '../../services/movimentacaoService';
import { OfflineQueueException } from '../../services/exceptions';
import { isConformidadeVencida, type ProdutoModel, type FuncionarioModel, type MovimentacaoModel } from '../../types/models';

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

  // Estados dos Colaboradores
  const [funcionarios, setFuncionarios] = useState<FuncionarioModel[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<FuncionarioModel | null>(null);
  const [crachaBusca, setCrachaBusca] = useState<string>('');
  const [isLoadingFuncionarios, setIsLoadingFuncionarios] = useState<boolean>(false);
  const [isScannerCrachaOpen, setIsScannerCrachaOpen] = useState<boolean>(false);

  // Estados dos Produtos
  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [isConsumo, setIsConsumo] = useState<boolean>(false);
  const [observacao, setObservacao] = useState<string>('');
  const [isLoadingProdutos, setIsLoadingProdutos] = useState<boolean>(false);

  // Carrinho e Operação
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [isLoadingGeral, setIsLoadingGeral] = useState<boolean>(false);

  // Modais de Segurança
  const [modalEpiBlocked, setModalEpiBlocked] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [modalPinOpen, setModalPinOpen] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isValidatingPin, setIsValidatingPin] = useState<boolean>(false);

  // Mensagens
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Carregamento independente de Colaboradores e Produtos
  useEffect(() => {
    let isMounted = true;

    async function carregarColaboradores() {
      setIsLoadingFuncionarios(true);
      try {
        const funcs = await funcionarioService.listarFuncionarios(empId);
        if (isMounted) {
          setFuncionarios(funcs);
        }
      } catch (err: any) {
        console.error('Erro ao listar funcionários:', err);
      } finally {
        if (isMounted) setIsLoadingFuncionarios(false);
      }
    }

    async function carregarProdutos() {
      setIsLoadingProdutos(true);
      try {
        const prods = await produtoService.listarProdutos(empId);
        if (isMounted) {
          setProdutos(prods);
        }
      } catch (err: any) {
        console.error('Erro ao listar produtos:', err);
      } finally {
        if (isMounted) setIsLoadingProdutos(false);
      }
    }

    carregarColaboradores();
    carregarProdutos();

    return () => {
      isMounted = false;
    };
  }, [empId]);

  // Opções formatadas para o Dropdown Pesquisável de Colaboradores
  const funcionarioOptions: SearchableOption[] = useMemo(() => {
    return funcionarios.map((f) => ({
      value: f.id,
      label: f.nome,
      code: f.cracha ? `Crachá: ${f.cracha}` : undefined,
      sublabel: f.departamento || f.funcao || undefined,
      type: 'colaborador' as const,
      badge: f.funcao ? { text: f.funcao, variant: 'neutral' as const } : undefined,
    }));
  }, [funcionarios]);

  // Opções formatadas para o Dropdown Pesquisável de Produtos
  const produtoOptions: SearchableOption[] = useMemo(() => {
    return produtos.map((p) => {
      const extraBadges: Array<{ text: string; variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = [];

      if (p.conformidade?.numero_ca) {
        const isCaVencido = isConformidadeVencida(p);
        extraBadges.push({
          text: `CA: ${p.conformidade.numero_ca}${isCaVencido ? ' (VENCIDO)' : ''}`,
          variant: isCaVencido ? 'danger' : 'warning',
        });
      }

      const estoqueVariant =
        (p.estoqueAtual ?? 0) <= 0
          ? 'danger'
          : (p.estoqueAtual ?? 0) < 5
          ? 'warning'
          : 'success';

      return {
        value: p.id,
        label: p.nome,
        code: p.codigo ? p.codigo : undefined,
        sublabel: p.categoria || undefined,
        type: 'produto' as const,
        badge: {
          text: `Estoque: ${p.estoqueAtual ?? 0} UN`,
          variant: estoqueVariant,
        },
        extraBadges,
      };
    });
  }, [produtos]);

  // Busca de Colaborador por Crachá
  const handleBuscarPorCracha = async (crachaParam?: string) => {
    const termo = (crachaParam ?? crachaBusca).trim();
    if (!termo) return;
    setMensagemErro(null);

    // 1. Procura na lista local já carregada
    const fLocal = funcionarios.find(
      (x) => x.cracha.trim().toLowerCase() === termo.toLowerCase()
    );
    if (fLocal) {
      setFuncionarioSelecionado(fLocal);
      setCrachaBusca(fLocal.cracha);
      return;
    }

    // 2. Busca no Supabase
    setIsLoadingFuncionarios(true);
    try {
      const func = await funcionarioService.getFuncionarioByCracha(termo, empId);
      if (func) {
        setFuncionarioSelecionado(func);
        setCrachaBusca(func.cracha);
        if (!funcionarios.some((x) => x.id === func.id)) {
          setFuncionarios((prev) => [...prev, func]);
        }
      } else {
        setMensagemErro('Colaborador não encontrado com este crachá.');
      }
    } catch (_) {
      setMensagemErro('Erro ao buscar colaborador.');
    } finally {
      setIsLoadingFuncionarios(false);
    }
  };

  // Adicionar ao Carrinho com Validação de Estoque e Trava RN-08
  const handleAdicionarAoCarrinho = () => {
    setMensagemErro(null);

    if (!funcionarioSelecionado) {
      setMensagemErro('Selecione primeiro o colaborador receptor.');
      return;
    }
    if (!produtoSelecionado) {
      setMensagemErro('Selecione um produto para adicionar ao carrinho.');
      return;
    }
    if (quantidade <= 0) {
      setMensagemErro('A quantidade deve ser maior que zero.');
      return;
    }

    // Saldo no estoque
    const qtdJaNoCarrinho = carrinho
      .filter((item) => item.produto.id === produtoSelecionado.id)
      .reduce((sum, item) => sum + item.quantidade, 0);

    if (quantidade + qtdJaNoCarrinho > produtoSelecionado.estoqueAtual) {
      setMensagemErro(
        `Estoque insuficiente: Saldo de ${produtoSelecionado.estoqueAtual} UN. Já no carrinho: ${qtdJaNoCarrinho} UN.`
      );
      return;
    }

    // REGRA MANDATÓRIA RN-08: BLOQUEIO DE EPI COM CA VENCIDO
    if (produtoSelecionado.conformidade) {
      const conf = produtoSelecionado.conformidade;
      const bloqueia = conf.bloquear_vencido ?? true;
      const tipo = conf.tipo_controle || 'CA';

      if (conf.status_manual === 'BLOQUEADO') {
        setModalEpiBlocked({
          isOpen: true,
          title: `ATENÇÃO: ${produtoSelecionado.nome}`,
          message: 'Produto bloqueado manualmente pela segurança do trabalho.',
        });
        return;
      }

      const dataStr = tipo === 'CA' ? conf.data_validade : conf.data_proxima_afericao;
      if (dataStr) {
        const validade = new Date(dataStr);
        const agora = new Date();
        if (validade.getTime() < agora.getTime()) {
          const formatada = validade.toLocaleDateString('pt-BR');
          if (bloqueia) {
            setModalEpiBlocked({
              isOpen: true,
              title: `SAÍDA BLOQUEADA: ${produtoSelecionado.nome}`,
              message: `O controle de conformidade (${tipo}) deste EPI está vencido desde ${formatada}. A entrega é terminantemente proibida conforme a Norma Regulamentadora.`,
            });
            return;
          }
        }
      }
    }

    // Passou nas validações: adicionar ao carrinho
    setCarrinho((prev) => [
      ...prev,
      {
        produto: produtoSelecionado,
        quantidade,
        isConsumo,
        observacao: observacao.trim(),
      },
    ]);

    // Limpar campos de produto mantendo o colaborador
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

      setModalPinOpen(false);
      setIsLoadingGeral(true);

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

      setMensagemSucesso(`${sucessoQtd} produto(s) retirado(s) com sucesso para ${funcionarioSelecionado.nome}!`);
      setCarrinho([]);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      if (err instanceof OfflineQueueException) {
        setMensagemSucesso('Sem conexão à internet. Registros salvos na fila offline e sincronizados assim que a rede retornar!');
        setCarrinho([]);
        setTimeout(() => {
          onBack();
        }, 1800);
      } else {
        const msg = err.message || 'Erro ao registrar saída.';
        if (msg.includes('SAIDA BLOQUEADA')) {
          setModalEpiBlocked({
            isOpen: true,
            title: 'SAÍDA BLOQUEADA NO SERVIDOR',
            message: msg.replace('SAIDA BLOQUEADA:', '').trim(),
          });
        } else {
          setMensagemErro(msg);
        }
      }
    } finally {
      setIsValidatingPin(false);
      setIsLoadingGeral(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header
        title="Saída de Produto"
        showBack={true}
        onBack={onBack}
      />

      <main className="zoestock-content-scroll page-content">
        <div className="operation-form">
          {/* SESSÃO 1: DADOS DO COLABORADOR RECEPTOR */}
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

          {/* Busca por Crachá */}
          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o crachá"
              value={crachaBusca}
              onChange={(e) => setCrachaBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarPorCracha()}
            />
            <button
              type="button"
              className="btn-icon-search"
              onClick={() => handleBuscarPorCracha()}
              disabled={isLoadingFuncionarios}
              title="Buscar crachá"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              className="btn-qr-action"
              onClick={() => setIsScannerCrachaOpen(true)}
              title="Escanear QR Code ou Código de Barras do Crachá"
            >
              <QrCode size={20} />
            </button>
          </div>

          {/* Dropdown Pesquisável de Colaboradores */}
          <div className="form-group" style={{ marginTop: '8px' }}>
            <SearchableSelect
              title="Selecione o Colaborador"
              placeholder={isLoadingFuncionarios ? 'Carregando colaboradores...' : 'Selecione o colaborador receptor'}
              searchPlaceholder="Pesquisar por nome, crachá ou setor..."
              emptyMessage="Nenhum colaborador encontrado com este termo."
              options={funcionarioOptions}
              value={funcionarioSelecionado?.id || ''}
              onChange={(selectedId) => {
                const f = funcionarios.find((x) => x.id === selectedId);
                setFuncionarioSelecionado(f || null);
                if (f) {
                  setCrachaBusca(f.cracha);
                  setMensagemErro(null);
                }
              }}
              disabled={isLoadingFuncionarios}
            />
          </div>

          {/* Card do Colaborador Selecionado */}
          {funcionarioSelecionado && (
            <div className="colaborador-card" style={{ borderLeft: '4px solid #D32F2F', backgroundColor: '#fdf7f7' }}>
              <div className="colaborador-icon" style={{ background: '#FFEBEE' }}>
                <User size={24} color="#D32F2F" />
              </div>
              <div className="colaborador-body">
                <div className="colaborador-name" style={{ color: '#B71C1C', fontWeight: 'bold' }}>
                  {funcionarioSelecionado.nome}
                </div>
                <div className="colaborador-meta">
                  <span><strong>Crachá:</strong> {funcionarioSelecionado.cracha}</span>
                  {funcionarioSelecionado.departamento && (
                    <span> | <strong>Setor:</strong> {funcionarioSelecionado.departamento}</span>
                  )}
                  {funcionarioSelecionado.funcao && (
                    <span> | <strong>Função:</strong> {funcionarioSelecionado.funcao}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SESSÃO 2: SELECIONAR PRODUTO PARA SAÍDA */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <h3>2. Selecionar Produto para Saída</h3>
          </div>

          {/* Dropdown Pesquisável de Produtos */}
          <div className="form-group">
            <label className="field-label">Produto *</label>
            <SearchableSelect
              title="Selecione o Produto"
              placeholder={isLoadingProdutos ? 'Carregando produtos...' : 'Selecione o produto no estoque'}
              searchPlaceholder="Pesquisar por nome, código ou CA..."
              emptyMessage="Nenhum produto encontrado com este termo."
              options={produtoOptions}
              value={produtoSelecionado?.id || ''}
              onChange={(selectedId) => {
                const found = produtos.find((p) => p.id === selectedId);
                setProdutoSelecionado(found || null);
                if (found) {
                  setIsConsumo(found.consumo || false);
                  setQuantidade(1);
                  setMensagemErro(null);
                }
              }}
              disabled={isLoadingProdutos}
            />
          </div>

          {/* Card Detalhes do Produto Selecionado */}
          {produtoSelecionado && (
            <div className="colaborador-card" style={{ borderLeft: '4px solid #1976D2', backgroundColor: '#F0F7FF', marginTop: 8 }}>
              <div className="colaborador-icon" style={{ background: '#E3F2FD' }}>
                <Package size={24} color="#1976D2" />
              </div>
              <div className="colaborador-body">
                <div className="colaborador-name" style={{ color: '#0D47A1', fontWeight: 'bold' }}>
                  {produtoSelecionado.nome}
                </div>
                <div className="colaborador-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 4 }}>
                  <span><strong>Estoque Disponível:</strong> {produtoSelecionado.estoqueAtual} UN</span>
                  <span>| <strong>Tipo:</strong> {produtoSelecionado.consumo ? 'Consumo' : 'Equipamento/EPI'}</span>
                  {produtoSelecionado.conformidade?.numero_ca && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      | <strong>CA:</strong> {produtoSelecionado.conformidade.numero_ca}
                      {produtoService.isEpiVencido(produtoSelecionado) ? (
                        <span style={{ color: '#D32F2F', fontWeight: 'bold' }}>(VENCIDO)</span>
                      ) : (
                        <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>(Válido)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seletor de Quantidade */}
          <QuantitySelector
            label="Quantidade solicitada *"
            value={quantidade}
            max={produtoSelecionado ? produtoSelecionado.estoqueAtual : undefined}
            onChange={setQuantidade}
          />

          {/* Checkbox Consumo */}
          <div className="checkbox-row" style={{ marginTop: '10px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isConsumo}
                onChange={(e) => setIsConsumo(e.target.checked)}
              />
              <div>
                <strong>Produto para consumo?</strong>
                <p className="checkbox-subtext">
                  Se marcado, não ficará como pendência na ficha do usuário.
                </p>
              </div>
            </label>
          </div>

          {/* Observação */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="field-label">Observação</label>
            <input
              type="text"
              className="text-input"
              placeholder="Opcional..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          {/* Botão Adicionar ao Carrinho */}
          <button
            type="button"
            className="btn-add-cart"
            onClick={handleAdicionarAoCarrinho}
            style={{ marginTop: '14px' }}
          >
            + Adicionar ao Carrinho
          </button>

          {/* SESSÃO 3: CARRINHO DE SAÍDA */}
          <div className="cart-section" style={{ marginTop: '20px' }}>
            <div className="cart-header">
              <ShoppingCart size={18} color="#D32F2F" />
              <h3>Carrinho de Saída ({carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'})</h3>
            </div>

            {carrinho.length === 0 ? (
              <div className="cart-empty">
                Nenhum produto adicionado ao carrinho ainda.
              </div>
            ) : (
              <div className="cart-items-list">
                {carrinho.map((item, idx) => (
                  <div key={idx} className="cart-item-card">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.produto.nome}</div>
                      <div className="cart-item-meta">
                        <span>Qtd: <strong>{item.quantidade} UN</strong></span>
                        <span> • {item.isConsumo ? 'Consumo' : 'Equipamento'}</span>
                        {item.observacao && <span> • Obs: {item.observacao}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => handleRemoverItem(idx)}
                      title="Remover item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-submit-action"
                  onClick={handleIniciarFinalizacao}
                  disabled={isLoadingGeral}
                  style={{ marginTop: '16px' }}
                >
                  {isLoadingGeral
                    ? 'Gravando movimentações...'
                    : `Confirmar Saída (${carrinho.length} itens)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL TRAVA RN-08 (EPI COM CA VENCIDO) */}
      <EpiBlockedModal
        isOpen={modalEpiBlocked.isOpen}
        title={modalEpiBlocked.title}
        message={modalEpiBlocked.message}
        onClose={() => setModalEpiBlocked({ isOpen: false, title: '', message: '' })}
      />

      {/* MODAL DE CONFIRMAÇÃO DE SENHA / PIN DE 6 DÍGITOS */}
      <PinModal
        isOpen={modalPinOpen}
        title="Confirmação com PIN"
        subtitle={
          funcionarioSelecionado
            ? `Digite a senha de 6 dígitos de ${funcionarioSelecionado.nome} para autorizar a retirada:`
            : 'Digite a senha de 6 dígitos:'
        }
        errorMessage={pinError}
        isLoading={isValidatingPin}
        onConfirm={handleConfirmarComPin}
        onClose={() => {
          if (!isValidatingPin) setModalPinOpen(false);
        }}
      />

      {/* MODAL DE LEITURA DE QR CODE / CÓDIGO DE BARRAS DO CRACHÁ */}
      <QrCodeScannerModal
        isOpen={isScannerCrachaOpen}
        title="Escanear QR Code do Crachá"
        subtitle="Aponte a câmera para o QR Code ou código do crachá do colaborador para identificação instantânea."
        onClose={() => setIsScannerCrachaOpen(false)}
        onScan={(matricula) => {
          setCrachaBusca(matricula);
          handleBuscarPorCracha(matricula);
        }}
      />
    </div>
  );
};
