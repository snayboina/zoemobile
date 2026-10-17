import React, { useEffect, useState } from 'react';
import { Search, MapPin, Package } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { produtoService } from '../../services/produtoService';
import { prateleiraService } from '../../services/prateleiraService';
import type { ProdutoModel, PrateleiraModel } from '../../types/models';

interface LocalizacaoScreenProps {
  onBack: () => void;
}

export const LocalizacaoScreen: React.FC<LocalizacaoScreenProps> = ({ onBack }) => {
  const { session, funcionario, empresaId } = useAuthStore();
  const empId = empresaId || session?.empresaId || funcionario?.empresa_id || '';

  const [activeTab, setActiveTab] = useState<'produto' | 'prateleira'>('produto');
  const [produtos, setProdutos] = useState<ProdutoModel[]>([]);
  const [prateleiras, setPrateleiras] = useState<PrateleiraModel[]>([]);

  // Tab 1: Buscar Produto
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoModel | null>(null);

  // Tab 2: Consultar Prateleira
  const [prateleiraSelecionada, setPrateleiraSelecionada] = useState<PrateleiraModel | null>(null);
  const [produtosNaPrateleira, setProdutosNaPrateleira] = useState<ProdutoModel[]>([]);
  const [isLoadingPrat, setIsLoadingPrat] = useState<boolean>(false);

  useEffect(() => {
    async function carregar() {
      if (!empId) return;
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

  const handleSelecionarPrateleira = async (pratId: string) => {
    const prat = prateleiras.find((p) => p.id === pratId) || null;
    setPrateleiraSelecionada(prat);
    if (!prat) {
      setProdutosNaPrateleira([]);
      return;
    }
    setIsLoadingPrat(true);
    try {
      const prods = await produtoService.getProdutosByPrateleira(prat.id!, empId);
      setProdutosNaPrateleira(prods);
    } catch (_) {
      setProdutosNaPrateleira([]);
    } finally {
      setIsLoadingPrat(false);
    }
  };

  const getNomePrateleira = (pratId?: string | null) => {
    if (!pratId) return 'Sem prateleira vinculada';
    const p = prateleiras.find((x) => x.id === pratId);
    return p ? `${p.codigoLocalizacao} (${p.zona})` : 'Localização não identificada';
  };

  return (
    <div className="zoestock-page-container">
      <Header title="Localização" showBack={true} onBack={onBack} />

      {/* Tabs */}
      <div className="location-tabs-bar">
        <button
          type="button"
          className={`location-tab ${activeTab === 'produto' ? 'active' : ''}`}
          onClick={() => setActiveTab('produto')}
        >
          <Search size={18} />
          <span>Buscar Produto</span>
        </button>
        <button
          type="button"
          className={`location-tab ${activeTab === 'prateleira' ? 'active' : ''}`}
          onClick={() => setActiveTab('prateleira')}
        >
          <MapPin size={18} />
          <span>Consultar Prateleira</span>
        </button>
      </div>

      <main className="zoestock-content-scroll">
        <div className="operation-form">
          {activeTab === 'produto' ? (
            <div>
              <div className="form-group">
                <label className="field-label">Selecione o Produto</label>
                <select
                  className="select-input"
                  value={produtoSelecionado?.id || ''}
                  onChange={(e) => {
                    const found = produtos.find((p) => p.id === e.target.value);
                    setProdutoSelecionado(found || null);
                  }}
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} - ` : ''}{p.nome}
                    </option>
                  ))}
                </select>
              </div>

              {produtoSelecionado && (
                <div className="location-result-card animate-scale-up">
                  <div className="location-icon-wrapper">
                    <MapPin size={36} color="#00796B" />
                  </div>
                  <div className="location-body">
                    <span className="location-label">LOCALIZAÇÃO / ENDEREÇO LOGÍSTICO</span>
                    <h3 className="location-name">{getNomePrateleira(produtoSelecionado.prateleiraId)}</h3>
                    <div className="location-meta">
                      <span>Estoque Disponível: <strong>{produtoSelecionado.estoqueAtual} UN</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="field-label">Selecione a Prateleira</label>
                <select
                  className="select-input"
                  value={prateleiraSelecionada?.id || ''}
                  onChange={(e) => handleSelecionarPrateleira(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {prateleiras.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigoLocalizacao} - Zona: {p.zona}
                    </option>
                  ))}
                </select>
              </div>

              {prateleiraSelecionada && (
                <div style={{ marginTop: '20px' }}>
                  <div className="form-section-header">
                    <h3>Produtos Alocados nesta Prateleira:</h3>
                  </div>

                  {isLoadingPrat ? (
                    <div className="loading-state">Consultando produtos...</div>
                  ) : produtosNaPrateleira.length === 0 ? (
                    <div className="empty-state-box">Nenhum produto cadastrado nesta prateleira.</div>
                  ) : (
                    <div className="shelf-products-list">
                      {produtosNaPrateleira.map((p) => (
                        <div key={p.id} className="shelf-product-card">
                          <Package size={20} color="#00796B" />
                          <div className="shelf-product-info">
                            <span className="shelf-product-title">{p.nome}</span>
                            <span className="shelf-product-qty">Estoque: {p.estoqueAtual} UN</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
