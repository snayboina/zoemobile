import React, { useEffect, useState } from 'react';
import {
  LogIn,
  LogOut as LogOutIcon,
  RotateCcw,
  ClipboardCheck,
  History,
  QrCode,
  Search,
  FileCheck,
  Building2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { syncService } from '../../services/offline/syncService';
import { produtoService } from '../../services/produtoService';
import type { ProdutoModel } from '../../types/models';

interface HomeScreenProps {
  onNavigate: (route: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { funcionario, session, empresaId, logout } = useAuthStore();
  const [pendenciasSync, setPendenciasSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState<ProdutoModel[]>([]);

  const handleLogout = async () => {
    await logout();
    onNavigate('onboarding');
  };

  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const carregarDados = async () => {
    setIsRefreshing(true);
    try {
      if (empId) {
        syncService.setEmpresaContext(empId);
        const baixos = await produtoService.getProdutosComEstoqueBaixo(empId);
        setProdutosEstoqueBaixo(baixos);
      }
    } catch (_) {
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (empId) {
      syncService.initialize(empId);
      carregarDados();
    }

    const unsubscribe = syncService.subscribe((count, syncing) => {
      setPendenciasSync(count);
      setIsSyncing(syncing);
    });

    return () => {
      unsubscribe();
    };
  }, [empId]);

  const handleSincronizarManual = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const erro = await syncService.sincronizarPendentes();
      if (erro) {
        const querDescartar = window.confirm(
          `Não foi possível sincronizar o registro:\n${erro}\n\nDeseja descartar esta pendência para liberar a fila?`
        );
        if (querDescartar) {
          await syncService.limparFila();
        }
      } else {
        await carregarDados();
      }
    } catch (e: any) {
      alert(`Erro na sincronização: ${e.message || String(e)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Os 8 cartões idênticos às fotos e ao Flutter:
  const menuItems = [
    {
      id: 'entrada',
      title: 'Entrada',
      icon: LogIn,
      iconColor: '#2E7D32',
      bgCircle: '#E8F5E9',
      route: 'entrada',
    },
    {
      id: 'saida',
      title: 'Saída',
      icon: LogOutIcon,
      iconColor: '#D32F2F',
      bgCircle: '#FFEBEE',
      route: 'saida',
    },
    {
      id: 'devolucao',
      title: 'Devolução',
      icon: RotateCcw,
      iconColor: '#EF6C00',
      bgCircle: '#FFF3E0',
      route: 'devolucao',
    },
    {
      id: 'inventario',
      title: 'Inventário',
      icon: ClipboardCheck,
      iconColor: '#7B1FA2',
      bgCircle: '#F3E5F5',
      route: 'inventario',
    },
    {
      id: 'movimentacoes',
      title: 'Movimentações',
      icon: History,
      iconColor: '#1976D2',
      bgCircle: '#E3F2FD',
      route: 'movimentacoes',
    },
    {
      id: 'scanner',
      title: 'Scanner',
      icon: QrCode,
      iconColor: '#37474F',
      bgCircle: '#ECEFF1',
      route: 'scanner',
    },
    {
      id: 'localizacao',
      title: 'Localização',
      icon: Search,
      iconColor: '#00796B',
      bgCircle: '#E0F2F1',
      route: 'localizacao',
    },
    {
      id: 'nada_consta',
      title: 'Nada Consta',
      icon: FileCheck,
      iconColor: '#2E7D32',
      bgCircle: '#E8F5E9',
      route: 'nada_consta',
    },
  ];

  return (
    <div className="zoestock-page-container">
      {/* Topo Vermelho Institucional */}
      <Header
        title="ZOESTOCK"
        showRefresh={true}
        onRefresh={carregarDados}
        isRefreshing={isRefreshing}
        showLogout={true}
        onLogout={handleLogout}
      />

      {/* Banner de Sincronizações Pendentes */}
      {pendenciasSync > 0 && (
        <div className="sync-banner-warning">
          <div className="sync-banner-info">
            <RotateCw size={18} className={isSyncing ? 'rotating' : ''} />
            <span>
              <strong>{pendenciasSync}</strong> Sincronizações Pendentes
            </span>
          </div>
          <button
            type="button"
            className="sync-banner-btn"
            onClick={handleSincronizarManual}
            disabled={isSyncing}
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      )}

      {/* Cabeçalho Curvo de Saudação */}
      <div className="zoestock-hero-card">
        <h2 className="hero-greeting">
          Olá, {funcionario?.nome || session?.nome || 'Operador'}
        </h2>
        <div className="hero-empresa">
          <Building2 size={16} />
          <span>{session?.empresaNome || funcionario?.empresaNome || 'ZOESTOCK'}</span>
        </div>
        <p className="hero-subtitle">O que deseja fazer hoje?</p>
      </div>

      {/* Conteúdo Principal: Alerta de Estoque Baixo (se houver) e Grade 2x2 */}
      <main className="zoestock-home-content">
        {produtosEstoqueBaixo.length > 0 && (
          <div
            className="estoque-baixo-card"
            onClick={() => onNavigate('movimentacoes')}
            role="button"
            tabIndex={0}
          >
            <AlertTriangle size={20} color="#D32F2F" />
            <div className="estoque-baixo-text">
              <strong>{produtosEstoqueBaixo.length} produto(s)</strong> com estoque abaixo do mínimo!
            </div>
          </div>
        )}

        {/* Grade de 2 colunas com cards brancos de cantos arredondados */}
        <div className="zoestock-grid-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="zoestock-operation-card"
                onClick={() => onNavigate(item.route)}
              >
                <div
                  className="card-icon-circle"
                  style={{ backgroundColor: item.bgCircle }}
                >
                  <IconComponent size={28} color={item.iconColor} strokeWidth={2.2} />
                </div>
                <span className="card-title">{item.title}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
