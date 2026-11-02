import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, ArrowRight } from 'lucide-react';

export interface FeedbackDetail {
  label: string;
  value: string;
}

export interface FeedbackModalProps {
  isOpen: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  details?: FeedbackDetail[];
  primaryButtonText?: string;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  type = 'success',
  title,
  description,
  details,
  primaryButtonText = 'OK, Entendido',
  onClose,
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  const iconBg = isSuccess
    ? '#ECFDF5'
    : isError
    ? '#FEF2F2'
    : isWarning
    ? '#FFFBEB'
    : '#EFF6FF';

  const iconColor = isSuccess
    ? '#059669'
    : isError
    ? '#DC2626'
    : isWarning
    ? '#D97706'
    : '#2563EB';

  const buttonBg = isSuccess
    ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
    : isError
    ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
    : isWarning
    ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
    : 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeInModal 0.25s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px 24px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          animation: 'popInModal 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone Circular com Halo */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
            boxShadow: `0 0 0 8px ${iconBg}80`,
          }}
        >
          {isSuccess && <CheckCircle2 size={38} color={iconColor} strokeWidth={2.5} />}
          {isError && <XCircle size={38} color={iconColor} strokeWidth={2.5} />}
          {isWarning && <AlertTriangle size={38} color={iconColor} strokeWidth={2.5} />}
          {!isSuccess && !isError && !isWarning && <Info size={38} color={iconColor} strokeWidth={2.5} />}
        </div>

        {/* Título */}
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: '20px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.3px',
          }}
        >
          {title}
        </h3>

        {/* Descrição */}
        <p
          style={{
            margin: '0 0 20px',
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#64748B',
          }}
        >
          {description}
        </p>

        {/* Detalhes / Resumo da Ação */}
        {details && details.length > 0 && (
          <div
            style={{
              width: '100%',
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '12px 14px',
              marginBottom: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
            }}
          >
            {details.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: '#64748B', fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botão de Ação */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            height: '48px',
            background: buttonBg,
            border: 'none',
            borderRadius: '14px',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            transition: 'transform 0.15s ease, filter 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span>{primaryButtonText}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popInModal {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
