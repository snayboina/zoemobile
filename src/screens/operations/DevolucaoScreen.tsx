import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, User } from 'lucide-react';
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

  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalPinOpen, setModalPinOpen] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isValidatingPin, setIsValidatingPin] = useState<boolean>(false);

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!empId) return;
      try {
        const [prods, funcs] = await Promise.all([
          produtoService.listarProdutos(empId),
          funcionarioService.listarFuncionarios(empId),
        ]);
        setProdutos(prods);
        setFuncionarios(funcs);
      } catch (_) {}
    }
    carregar();
  }, [empId]);

  const carregarPendencias = async (funcId: string) => {
    try {
      const pends = await movimentacaoService.getPendenciasFuncionario(funcId, empId);
      setPendencias(pends);
    } catch (_) {
      setPendencias([]);
    }
  };

  const handleBuscarColaborador = async () => {
    if (!crachaBusca.trim()) return;
    try {
      const f = await funcionarioService.getFuncionarioByCracha(crachaBusca.trim(), empId);
      if (f) {
        setFuncionarioSelecionado(f);
        carregarPendencias(f.id);
        setMensagemErro(null);
      } else {
        setMensagemErro('Colaborador não encontrado.');
      }
    } catch (_) {
      setMensagemErro('Erro ao buscar colaborador.');
    }
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

  const handleConfirmarComPin = async (pin: string) => {
    if (!funcionarioSelecionado || !produtoSelecionado) return;
    setIsValidatingPin(true);
    setPinError(null);

    try {
      const validacao = await funcionarioService.validarSenhaMovimentacao(
        funcionarioSelecionado.id,
        pin
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
        observacao: observacao.trim() || 'Devolução confirmada',
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

      setMensagemSucesso('Devolução registrada com sucesso!');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      if (err instanceof OfflineQueueException) {
        setMensagemSucesso('Dispositivo sem internet. Devolução salva offline e será sincronizada!');
        setTimeout(() => {
          onBack();
        }, 2000);
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

      <main className="zoestock-content-scroll">
        <form onSubmit={handleIniciarDevolucao} className="operation-form">
          <div className="form-section-header">
            <h3>1. Colaborador que está Devolvendo</h3>
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
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarColaborador()}
            />
            <button
              type="button"
              className="btn-search-action orange"
              onClick={handleBuscarColaborador}
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
                if (f) carregarPendencias(f.id);
              }}
            >
              <option value="">Ou selecione da lista...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.cracha} - {f.nome}
                </option>
              ))}
            </select>
          </div>

          {funcionarioSelecionado && (
            <div className="colaborador-card orange-border">
              <div className="colaborador-icon">
                <User size={24} color="#EF6C00" />
              </div>
              <div className="colaborador-body">
                <div className="colaborador-name">{funcionarioSelecionado.nome}</div>
                <div className="colaborador-meta">
                  <span>Crachá: {funcionarioSelecionado.cracha}</span>
                  <span> | Pendências: <strong>{pendencias.length} item(ns)</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Pendências do Colaborador */}
          {pendencias.length > 0 && (
            <div className="pendencias-box">
              <h4>Itens sob responsabilidade deste colaborador:</h4>
              <div className="pendencias-chips">
                {pendencias.map((p) => (
                  <button
                    key={p.produto_id}
                    type="button"
                    className="pendencia-chip"
                    onClick={() => {
                      const prod = produtos.find((x) => x.id === p.produto_id);
                      if (prod) {
                        setProdutoSelecionado(prod);
                        setQuantidade(p.saldo_pendente);
                      }
                    }}
                  >
                    <span>{p.nome}: <strong>{p.saldo_pendente} UN</strong></span>
                  </button>
                ))}
              </div>
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
              required
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

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="field-label">Observação / Estado de Conservação</label>
            <input
              type="text"
              className="text-input"
              placeholder="Ex: Bom estado, higienizado, avaria leve..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary-action orange"
            disabled={isLoading || !funcionarioSelecionado || !produtoSelecionado}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Registrando...' : 'Confirmar Devolução'}
          </button>
        </form>
      </main>

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
