import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Check, Package, User } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  code?: string;
  badge?: {
    text: string;
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  };
  extraBadges?: Array<{
    text: string;
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  }>;
  type?: 'produto' | 'colaborador' | 'default';
  disabled?: boolean;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  title?: string;
  options: SearchableOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Selecione uma opção',
  title = 'Selecionar',
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  searchPlaceholder = 'Pesquisar por nome, código ou crachá...',
  emptyMessage = 'Nenhum resultado encontrado.',
  className = '',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Encontra a opção selecionada atual
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Foco no campo de busca ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filtragem flexível com suporte a normalização de acentos e múltiplos termos
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!term) return options;

    return options.filter((opt) => {
      const labelNorm = opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const codeNorm = (opt.code || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sublabelNorm = (opt.sublabel || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const badgeNorm = (opt.badge?.text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      return (
        labelNorm.includes(term) ||
        codeNorm.includes(term) ||
        sublabelNorm.includes(term) ||
        badgeNorm.includes(term)
      );
    });
  }, [options, searchTerm]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`searchable-select-wrapper ${className}`} style={style}>
      {label && (
        <label className="field-label">
          {label} {required && '*'}
        </label>
      )}

      {/* Botão Gatilho (Trigger) que imita um Select elegante */}
      <button
        type="button"
        className={`searchable-select-trigger ${selectedOption ? 'has-value' : 'is-placeholder'} ${
          disabled ? 'is-disabled' : ''
        }`}
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="trigger-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="trigger-chevron" />
      </button>

      {/* Modal / Bottom-Sheet de Seleção Mobile-First */}
      {isOpen && (
        <div className="searchable-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="searchable-modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Barra de Arraste / Indicador Superior Mobile */}
            <div className="sheet-handle-pill" />

            {/* Cabeçalho do Modal */}
            <div className="searchable-modal-header">
              <div className="searchable-modal-title-group">
                <h3 className="searchable-modal-title">{title}</h3>
                <span className="searchable-modal-count">
                  {filteredOptions.length} {filteredOptions.length === 1 ? 'disponível' : 'disponíveis'}
                </span>
              </div>
              <button
                type="button"
                className="searchable-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Campo de Busca Rápida com Ícone */}
            <div className="searchable-search-box">
              <Search size={18} className="search-box-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-box-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-box-clear"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Lista Rolável com Espaçamento Organizado e Badges */}
            <div className="searchable-options-list">
              {filteredOptions.length === 0 ? (
                <div className="searchable-empty-state">
                  <div className="empty-icon-circle">
                    <Search size={24} color="#94A3B8" />
                  </div>
                  <strong className="empty-title">Nenhum resultado encontrado</strong>
                  <p className="empty-desc">
                    Não encontramos correspondência para "<b>{searchTerm}</b>".
                  </p>
                  <button
                    type="button"
                    className="btn-clear-filter"
                    onClick={() => setSearchTerm('')}
                  >
                    Limpar pesquisa
                  </button>
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`searchable-option-item ${isSelected ? 'is-selected' : ''} ${
                        opt.disabled ? 'is-disabled' : ''
                      }`}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      disabled={opt.disabled}
                    >
                      <div className="option-icon-col">
                        {opt.type === 'colaborador' ? (
                          <div className="option-icon-circle colaborador">
                            <User size={18} />
                          </div>
                        ) : (
                          <div className="option-icon-circle produto">
                            <Package size={18} />
                          </div>
                        )}
                      </div>

                      <div className="option-info-col">
                        <div className="option-primary-line">
                          <span className="option-title">{opt.label}</span>
                          {isSelected && <Check size={18} className="option-check-icon" />}
                        </div>

                        {/* Metadados Organizados em Badges Sutis */}
                        <div className="option-badges-row">
                          {opt.code && (
                            <span className="badge-tag code-badge">
                              {opt.code}
                            </span>
                          )}
                          {opt.sublabel && (
                            <span className="badge-tag sublabel-badge">
                              {opt.sublabel}
                            </span>
                          )}
                          {opt.badge && (
                            <span className={`badge-tag variant-${opt.badge.variant || 'neutral'}`}>
                              {opt.badge.text}
                            </span>
                          )}
                          {opt.extraBadges?.map((extra, idx) => (
                            <span
                              key={idx}
                              className={`badge-tag variant-${extra.variant || 'neutral'}`}
                            >
                              {extra.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
