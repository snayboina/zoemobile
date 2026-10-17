import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { movimentacaoService } from '../../services/movimentacaoService';
import type { MovimentacaoModel } from '../../types/models';

interface MovimentacoesScreenProps {
  onBack: () => void;
}

export const MovimentacoesScreen: React.FC<MovimentacoesScreenProps> = ({ onBack }) => {
  const { session, funcionario, empresaId } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoModel[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const carregar = async () => {
    if (!empId) return;
    setIsLoading(true);
    try {
      const tipo = filtroTipo === 'TODOS' ? undefined : filtroTipo;
      const list = await movimentacaoService.getMovimentacoesRecentes(empId, tipo, 50);
      setMovimentacoes(list);
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [empId, filtroTipo]);

  const getIconAndColor = (tipo: string) => {
    switch (tipo) {
      case 'EN':
        return { icon: LogIn, color: '#2E7D32', bg: '#E8F5E9', label: 'Entrada' };
      case 'SA':
      case 'CONSUMO':
        return { icon: LogOut, color: '#D32F2F', bg: '#FFEBEE', label: tipo === 'CONSUMO' ? 'Consumo' : 'Saída' };
      case 'DV':
        return { icon: RotateCcw, color: '#EF6C00', bg: '#FFF3E0', label: 'Devolução' };
      default:
        return { icon: ArrowRightLeft, color: '#1976D2', bg: '#E3F2FD', label: tipo };
    }
  };

  return (
    <div className="zoestock-page-container">
      <Header
        title="Movimentações Recentes"
        showBack={true}
        onBack={onBack}
        showRefresh={true}
        onRefresh={carregar}
        isRefreshing={isLoading}
      />

      {/* Chips de Filtro */}
      <div className="filter-chips-bar">
        {[
          { key: 'TODOS', label: 'Todos' },
          { key: 'EN', label: 'Entrada' },
          { key: 'SA', label: 'Saída' },
          { key: 'DV', label: 'Devolução' },
        ].map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`filter-chip ${filtroTipo === chip.key ? 'active' : ''}`}
            onClick={() => setFiltroTipo(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <main className="zoestock-content-scroll">
        {isLoading ? (
          <div className="loading-state">Carregando movimentações...</div>
        ) : movimentacoes.length === 0 ? (
          <div className="empty-state-box">Nenhuma movimentação encontrada para o filtro selecionado.</div>
        ) : (
          <div className="movimentacoes-list">
            {movimentacoes.map((mov, idx) => {
              const meta = getIconAndColor(mov.tipo);
              const IconComp = meta.icon;
              const dataFormatada = mov.createdAt
                ? new Date(mov.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div key={idx} className="movimentacao-card">
                  <div className="mov-icon-circle" style={{ backgroundColor: meta.bg }}>
                    <IconComp size={22} color={meta.color} />
                  </div>
                  <div className="mov-content-body">
                    <div className="mov-product-name">{mov.nomeProduto || 'Produto'}</div>
                    <div className="mov-meta-row">
                      <span className="mov-tipo-tag" style={{ color: meta.color }}>
                        {meta.label}: <strong>{mov.quantidade} UN</strong>
                      </span>
                      {mov.nomeFuncionario && (
                        <span className="mov-funcionario-tag">Func: {mov.nomeFuncionario}</span>
                      )}
                    </div>
                    {dataFormatada && <div className="mov-date">{dataFormatada}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
