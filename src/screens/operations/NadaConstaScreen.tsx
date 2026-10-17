import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, User, WifiOff } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { funcionarioService } from '../../services/funcionarioService';
import { movimentacaoService } from '../../services/movimentacaoService';
import type { PendenciaColaborador } from '../../services/movimentacaoService';
import type { FuncionarioModel } from '../../types/models';

interface NadaConstaScreenProps {
  onBack: () => void;
}

export const NadaConstaScreen: React.FC<NadaConstaScreenProps> = ({ onBack }) => {
  const { session, funcionario, empresaId } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const [cracha, setCracha] = useState<string>('');
  const [funcionarioConsultado, setFuncionarioConsultado] = useState<FuncionarioModel | null>(null);
  const [pendencias, setPendencias] = useState<PendenciaColaborador[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOffline = !navigator.onLine;

  const handleConsultar = async () => {
    if (!cracha.trim()) return;
    setErrorMessage(null);
    setHasSearched(false);

    // REGRA MANDATÓRIA: Bloqueio de emissão de Nada Consta offline
    if (isOffline) {
      setErrorMessage('Consulta indisponível para emissão definitiva. Conecte-se à internet para validar as pendências.');
      return;
    }

    setIsLoading(true);

    try {
      const func = await funcionarioService.getFuncionarioByCracha(cracha.trim(), empId);
      if (!func) {
        setErrorMessage('Colaborador não encontrado com este crachá.');
        setIsLoading(false);
        return;
      }

      setFuncionarioConsultado(func);
      const pends = await movimentacaoService.getPendenciasFuncionario(func.id, empId);
      setPendencias(pends);
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao consultar pendências no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Nada Consta" showBack={true} onBack={onBack} />

      <main className="zoestock-content-scroll">
        <div className="operation-form">
          <div className="form-section-header">
            <h3>Consulta de Pendências de Colaborador</h3>
          </div>

          {isOffline && (
            <div className="alert-box warning">
              <WifiOff size={18} />
              <span>Consulta indisponível para emissão definitiva. Conecte-se à internet para validar as pendências.</span>
            </div>
          )}

          {errorMessage && (
            <div className="alert-box error">
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o crachá do colaborador..."
              value={cracha}
              onChange={(e) => setCracha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
              disabled={isOffline || isLoading}
            />
            <button
              type="button"
              className="btn-search-action green"
              onClick={handleConsultar}
              disabled={isOffline || isLoading || !cracha.trim()}
            >
              <Search size={18} />
              <span>Consultar</span>
            </button>
          </div>

          {funcionarioConsultado && (
            <div className="colaborador-card green-border" style={{ marginTop: '16px' }}>
              <div className="colaborador-icon">
                <User size={24} color="#2E7D32" />
              </div>
              <div className="colaborador-body">
                <div className="colaborador-name">{funcionarioConsultado.nome}</div>
                <div className="colaborador-meta">
                  <span>Crachá: {funcionarioConsultado.cracha}</span>
                  {funcionarioConsultado.departamento && (
                    <span> | {funcionarioConsultado.departamento}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resultado da Consulta */}
          {hasSearched && (
            <div className="nada-consta-result-container" style={{ marginTop: '24px' }}>
              {pendencias.length === 0 ? (
                <div className="nada-consta-badge-card success animate-scale-up">
                  <div className="nada-consta-icon-circle">
                    <CheckCircle2 size={64} color="#2E7D32" />
                  </div>
                  <h2 className="nada-consta-title green">NADA CONSTA</h2>
                  <p className="nada-consta-desc">
                    O colaborador não possui pendências de materiais, ferramentas ou EPIs em seu nome.
                  </p>
                  <div className="nada-consta-timestamp">
                    Consulta validada no servidor em: {new Date().toLocaleString('pt-BR')}
                  </div>
                  <button
                    type="button"
                    className="btn-print-certificate"
                    onClick={() => window.print()}
                  >
                    Emitir / Imprimir Declaração
                  </button>
                </div>
              ) : (
                <div className="nada-consta-badge-card has-debt">
                  <div className="nada-consta-icon-circle warning">
                    <AlertTriangle size={54} color="#D32F2F" />
                  </div>
                  <h2 className="nada-consta-title red">EXISTEM PENDÊNCIAS</h2>
                  <p className="nada-consta-desc">
                    O colaborador possui os seguintes itens sob sua responsabilidade não devolvidos:
                  </p>

                  <div className="pendencias-detail-list">
                    {pendencias.map((item) => (
                      <div key={item.produto_id} className="pendencia-item-row">
                        <span className="pendencia-item-name">{item.nome}</span>
                        <span className="pendencia-item-qty">
                          Devendo: <strong>{item.saldo_pendente} UN</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
