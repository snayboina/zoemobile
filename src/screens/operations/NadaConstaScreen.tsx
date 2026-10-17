import React, { useEffect, useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, User, WifiOff, QrCode } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { QrCodeScannerModal } from '../../components/common/QrCodeScannerModal';
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

  const [funcionarios, setFuncionarios] = useState<FuncionarioModel[]>([]);
  const [cracha, setCracha] = useState<string>('');
  const [funcionarioConsultado, setFuncionarioConsultado] = useState<FuncionarioModel | null>(null);
  const [pendencias, setPendencias] = useState<PendenciaColaborador[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScannerCrachaOpen, setIsScannerCrachaOpen] = useState<boolean>(false);

  const isOffline = !navigator.onLine;

  useEffect(() => {
    async function carregarLista() {
      try {
        const funcs = await funcionarioService.listarFuncionarios(empId);
        setFuncionarios(funcs);
      } catch (_) {}
    }
    carregarLista();
  }, [empId]);

  const executarConsulta = async (func: FuncionarioModel) => {
    setErrorMessage(null);
    setHasSearched(false);

    if (isOffline) {
      setErrorMessage('Consulta indisponível para emissão definitiva. Conecte-se à internet para validar as pendências.');
      return;
    }

    setIsLoading(true);
    setFuncionarioConsultado(func);
    try {
      const pends = await movimentacaoService.getPendenciasFuncionario(func.id, empId);
      setPendencias(pends);
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao consultar pendências no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsultar = async (crachaParam?: string) => {
    const termo = (crachaParam ?? cracha).trim();
    if (!termo) return;

    const fLocal = funcionarios.find((x) => x.cracha.trim().toLowerCase() === termo.toLowerCase());
    if (fLocal) {
      setCracha(fLocal.cracha);
      executarConsulta(fLocal);
      return;
    }

    setIsLoading(true);
    try {
      const func = await funcionarioService.getFuncionarioByCracha(termo, empId);
      if (!func) {
        setErrorMessage('Colaborador não encontrado com este crachá.');
        setIsLoading(false);
        return;
      }
      setCracha(func.cracha);
      executarConsulta(func);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao buscar colaborador.');
      setIsLoading(false);
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Consulta Nada Consta" showBack={true} onBack={onBack} />

      <main className="zoestock-content-scroll page-content">
        <div className="operation-form">
          <div className="form-section-header">
            <h3>Consultar Situação do Colaborador</h3>
            <p className="section-subtext" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Verifique pendências de equipamentos e EPIs para homologação, rescisão ou auditoria.
            </p>
          </div>

          {errorMessage && (
            <div className="alert-box error">
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isOffline && (
            <div className="alert-box warning">
              <WifiOff size={18} />
              <span>Você está offline. O Nada Consta exige validação online no banco de dados.</span>
            </div>
          )}

          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o crachá"
              value={cracha}
              onChange={(e) => setCracha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
              disabled={isOffline || isLoading}
            />
            <button
              type="button"
              className="btn-icon-search"
              onClick={() => handleConsultar()}
              disabled={isOffline || isLoading}
              title="Consultar crachá"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              className="btn-qr-action"
              onClick={() => setIsScannerCrachaOpen(true)}
              disabled={isOffline}
              title="Escanear QR Code ou Código de Barras do Crachá"
            >
              <QrCode size={20} />
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <select
              className="select-input"
              value={funcionarioConsultado?.id || ''}
              onChange={(e) => {
                const f = funcionarios.find((x) => x.id === e.target.value);
                if (f) {
                  setCracha(f.cracha);
                  executarConsulta(f);
                }
              }}
              disabled={isOffline || isLoading}
            >
              <option value="">Selecione o colaborador ({funcionarios.length} disponíveis)...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.cracha} - {f.nome}
                </option>
              ))}
            </select>
          </div>

          {funcionarioConsultado && (
            <div className="colaborador-card" style={{ borderLeft: '4px solid #D32F2F', backgroundColor: '#fdf7f7', marginTop: 14 }}>
              <div className="colaborador-icon" style={{ background: '#FFEBEE' }}>
                <User size={24} color="#D32F2F" />
              </div>
              <div className="colaborador-body">
                <div className="colaborador-name" style={{ color: '#B71C1C', fontWeight: 'bold' }}>
                  {funcionarioConsultado.nome}
                </div>
                <div className="colaborador-meta">
                  <span><strong>Crachá:</strong> {funcionarioConsultado.cracha}</span>
                  {funcionarioConsultado.departamento && (
                    <span> | <strong>Setor:</strong> {funcionarioConsultado.departamento}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RESULTADO DA CONSULTA */}
          {hasSearched && funcionarioConsultado && (
            <div className="resultado-nada-consta" style={{ marginTop: '20px' }}>
              {pendencias.length === 0 ? (
                <div className="nada-consta-box regular" style={{ padding: 20, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, textAlign: 'center' }}>
                  <CheckCircle2 size={48} color="#2E7D32" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ color: '#1B5E20', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                    CERTIDÃO NADA CONSTA EMITIDA
                  </h4>
                  <p style={{ margin: 0, color: '#2E7D32', fontSize: '0.9rem' }}>
                    O colaborador <strong>{funcionarioConsultado.nome}</strong> não possui nenhum item ou equipamento pendente de devolução nesta empresa.
                  </p>
                </div>
              ) : (
                <div className="nada-consta-box pendente" style={{ padding: 16, background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <AlertTriangle size={28} color="#D32F2F" />
                    <div>
                      <h4 style={{ color: '#B71C1C', margin: 0, fontSize: '1.05rem' }}>
                        PENDÊNCIAS EM ABERTO ({pendencias.length})
                      </h4>
                      <p style={{ margin: 0, color: '#C62828', fontSize: '0.85rem' }}>
                        Itens ainda em posse do colaborador que necessitam de devolução:
                      </p>
                    </div>
                  </div>

                  <div className="pendencias-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendencias.map((item, idx) => (
                      <div key={idx} style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #FFCDD2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#333' }}>{item.nome}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            Quantidade em aberto
                          </div>
                        </div>
                        <span style={{ background: '#D32F2F', color: '#fff', padding: '4px 8px', borderRadius: 6, fontWeight: 'bold', fontSize: '0.85rem' }}>
                          Pendente: {item.saldo_pendente} UN
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

      {/* Modal de Leitura de QR Code / Código de Barras do Crachá */}
      <QrCodeScannerModal
        isOpen={isScannerCrachaOpen}
        title="Escanear QR Code do Crachá"
        subtitle="Aponte a câmera para o QR Code ou código do crachá para consulta rápida de pendências."
        onClose={() => setIsScannerCrachaOpen(false)}
        onScan={(matricula) => {
          setCracha(matricula);
          handleConsultar(matricula);
        }}
      />
    </div>
  );
};
