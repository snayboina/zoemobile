import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, User, Search, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { QuantitySelector } from '../../components/operations/QuantitySelector';
import { PinModal } from '../../components/operations/PinModal';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { funcionarioService } from '../../services/funcionarioService';
import { movimentacaoService } from '../../services/movimentacaoService';
import type { PendenciaColaborador } from '../../services/movimentacaoService';
import { OfflineQueueException } from '../../services/exceptions';
import type { ProdutoModel, FuncionarioModel, MovimentacaoModel } from '../../types/models';

interface DevolucaoScreenProps {
  onBack: () => void;
}

export const DevolucaoScreen: React.FC<DevolucaoScreenProps> = ({ onBack }) => {
  const { funcionario, session, empresaId, device } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const [funcionarios, setFuncionarios] = useState<FuncionarioModel[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<FuncionarioModel | null>(null);
  const [crachaBusca, setCrachaBusca] = useState<string>('');
  const [pendencias, setPendencias] = useState<PendenciaColaborador[]>([]);
  const [isLoadingPendencias, setIsLoadingPendencias] = useState<boolean>(false);

  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingFuncionarios, setIsLoadingFuncionarios] = useState<boolean>(false);
  // isLoadingProdutos

  const [modalPinOpen, setModalPinOpen] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isValidatingPin, setIsValidatingPin] = useState<boolean>(false);

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function carregar() {
      if (!empId) return;
      setIsLoadingFuncionarios(true);
      
      try {
        const funcs = await funcionarioService.listarFuncionarios(empId);
        if (isMounted) setFuncionarios(funcs);
      } catch (_) {}
      finally {
        if (isMounted) setIsLoadingFuncionarios(false);
      }

      try {
        const prods = await produtoService.listarProdutos(empId);
        if (isMounted) setProdutos(prods);
      } catch (_) {}

    }

    carregar();
    return () => { isMounted = false; };
  }, [empId]);

  const carregarPendencias = async (funcId: string) => {
    setIsLoadingPendencias(true);
    try {
      const pends = await movimentacaoService.getPendenciasFuncionario(funcId, empId);
      setPendencias(pends);
    } catch (_) {
      setPendencias([]);
    } finally {
      setIsLoadingPendencias(false);
    }
  };

  const handleBuscarColaborador = async () => {
    const termo = crachaBusca.trim();
    if (!termo) return;
    setMensagemErro(null);

    const fLocal = funcionarios.find((x) => x.cracha.trim().toLowerCase() === termo.toLowerCase());
    if (fLocal) {
      setFuncionarioSelecionado(fLocal);
      carregarPendencias(fLocal.id);
      return;
    }

    setIsLoadingFuncionarios(true);
    try {
      const f = await funcionarioService.getFuncionarioByCracha(termo, empId);
      if (f) {
        setFuncionarioSelecionado(f);
        if (!funcionarios.some((x) => x.id === f.id)) {
          setFuncionarios((prev) => [...prev, f]);
        }
        carregarPendencias(f.id);
      } else {
        setMensagemErro('Colaborador não encontrado.');
      }
    } catch (_) {
      setMensagemErro('Erro ao buscar colaborador.');
    } finally {
      setIsLoadingFuncionarios(false);
    }
  };

  const handleSelecionarPendencia = (p: PendenciaColaborador) => {
    const prod: ProdutoModel = produtos.find((x) => x.id === p.produto_id) || {
      id: p.produto_id,
      nome: p.nome,
      codigo: '',
      codigo_barras: '',
      estoqueAtual: p.saldo_pendente,
      estoqueMinimo: 0,
      ativo: true,
      consumo: false,
      empresa_id: empId,
      excluido: false,
    };
    setProdutoSelecionado(prod);
    setQuantidade(p.saldo_pendente > 0 ? p.saldo_pendente : 1);
  };

  const handleIniciarDevolucao = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!funcionarioSelecionado) {
      setMensagemErro('Selecione um colaborador primeiro.');
      return;
    }
    if (!produtoSelecionado) {
      setMensagemErro('Selecione o produto que está sendo devolvido.');
      return;
    }
    if (quantidade <= 0) {
      setMensagemErro('A quantidade deve ser maior que zero.');
      return;
    }

    setPinError(null);
    setModalPinOpen(true);
  };

  const handleConfirmarPin = async (pinDigitado: string) => {
    if (!funcionarioSelecionado || !produtoSelecionado) return;
    setIsValidatingPin(true);
    setPinError(null);

    try {
      const validacao = await funcionarioService.validarSenhaMovimentacao(
        funcionarioSelecionado.id,
        pinDigitado
      );

      if (!validacao.success) {
        setPinError(validacao.message || 'Senha incorreta.');
        setIsValidatingPin(false);
        return;
      }

      setModalPinOpen(false);
      setIsLoading(true);

      const currentUser = funcionario;
      const mov: MovimentacaoModel = {
        produtoId: produtoSelecionado.id,
        funcionarioId: funcionarioSelecionado.id,
        prateleiraId: produtoSelecionado.prateleiraId,
        tipo: 'DV',
        quantidade: quantidade,
        observacao: observacao.trim(),
        nomeProduto: produtoSelecionado.nome,
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
        produtoSelecionado
      );

      setMensagemSucesso(`Devolução de ${quantidade} UN de ${produtoSelecionado.nome} registrada com sucesso!`);
      carregarPendencias(funcionarioSelecionado.id);
      setProdutoSelecionado(null);
      setQuantidade(1);
      setObservacao('');

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      if (err instanceof OfflineQueueException) {
        setMensagemSucesso('Registro salvo offline e será sincronizado automaticamente!');
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setMensagemErro(err.message || 'Erro ao registrar devolução.');
      }
    } finally {
      setIsValidatingPin(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Devolução de Produto" showBack={true} onBack={onBack} />

      <div className="page-content">
        <form onSubmit={handleIniciarDevolucao} className="operation-form">
          <div className="form-section-header">
            <h3>1. Colaborador Devolvente</h3>
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

          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o crachá do colaborador..."
              value={crachaBusca}
              onChange={(e) => setCrachaBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBuscarColaborador();
                }
              }}
            />
            <button
              type="button"
              className="btn-search-action"
              onClick={handleBuscarColaborador}
              disabled={isLoadingFuncionarios}
            >
              <Search size={16} style={{ marginRight: 4 }} />
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
                if (f) {
                  setCrachaBusca(f.cracha);
                  carregarPendencias(f.id);
                  setMensagemErro(null);
                }
              }}
            >
              <option value="">
                {isLoadingFuncionarios
                  ? 'Carregando colaboradores...'
                  : `Selecione na lista (${funcionarios.length} disponíveis)...`}
              </option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.cracha} - {f.nome} {f.departamento ? `(${f.departamento})` : ''}
                </option>
              ))}
            </select>
          </div>

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
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE PENDÊNCIAS EM ABERTO */}
          {funcionarioSelecionado && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#333' }}>
                  Equipamentos / EPIs Pendentes de Devolução:
                </h4>
                {isLoadingPendencias && <RefreshCw size={14} className="spin" />}
              </div>

              {pendencias.length === 0 ? (
                <div style={{ padding: 12, background: '#E8F5E9', borderRadius: 8, color: '#2E7D32', fontSize: '0.9rem' }}>
                  ✅ Nenhuma pendência em aberto para este colaborador.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendencias.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelecionarPendencia(p)}
                      style={{
                        padding: 10,
                        background: '#FFF8E1',
                        border: '1px solid #FFE082',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{p.nome}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          Saída: {p.saldo_pendente}
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#E65100', background: '#FFE082', padding: '4px 8px', borderRadius: 6, fontSize: '0.85rem' }}>
                        Pendente: {p.saldo_pendente} UN
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-section-header" style={{ marginTop: '24px' }}>
            <h3>2. Produto a Devolver</h3>
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
                  {p.codigo ? `${p.codigo} - ` : ''}{p.nome}
                </option>
              ))}
            </select>
          </div>

          <QuantitySelector
            label="Quantidade Devolvida *"
            value={quantidade}
            onChange={setQuantidade}
          />

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="field-label">Observação / Estado do Item</label>
            <input
              type="text"
              className="text-input"
              placeholder="Ex: Em perfeito estado, limpo..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-submit-action"
            disabled={isLoading}
            style={{ marginTop: '20px' }}
          >
            {isLoading ? 'Registrando devolução...' : 'Confirmar Devolução'}
          </button>
        </form>
      </div>

      <PinModal
        isOpen={modalPinOpen}
        title="PIN de Confirmação"
        subtitle={
          funcionarioSelecionado
            ? `Digite o PIN de 6 dígitos de ${funcionarioSelecionado.nome} para confirmar a devolução:`
            : 'Digite o PIN:'
        }
        errorMessage={pinError}
        isLoading={isValidatingPin}
        onConfirm={handleConfirmarPin}
        onClose={() => setModalPinOpen(false)}
      />
    </div>
  );
};
