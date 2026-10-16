import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface OnboardingScreenProps {
  onNavigate: (route: string) => void;
}

const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: 'Controle de Estoque Industrial',
    subtitle: 'Gestão Inteligente de Materiais',
    description:
      'Controle entradas, saídas e devoluções em tempo real com rastreabilidade total de armazém e lotes.',
    image: '/assets/onboarding/onboarding_1.png',
  },
  {
    id: 2,
    title: 'Conformidade Rigorosa de EPIs',
    subtitle: 'Segurança Ocupacional e Validade de CA',
    description:
      'Trava automática na entrega de EPIs com Certificado de Aprovação (CA) vencido ou inválido.',
    image: '/assets/onboarding/onboarding_2.png',
  },
  {
    id: 3,
    title: 'Endereçamento Logístico',
    subtitle: 'Zonas, Prateleiras e Andares',
    description:
      'Localize rapidamente qualquer produto através do mapeamento preciso de ruas, níveis e posições.',
    image: '/assets/onboarding/onboarding_3.png',
  },
  {
    id: 4,
    title: 'Operação Offline Contínua',
    subtitle: 'Sincronização Automática em Contingência',
    description:
      'Continue operando mesmo sem conexão com a internet. O aplicativo sincroniza os dados assim que o sinal retornar.',
    image: '/assets/onboarding/onboarding_4.png',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { completeOnboarding } = useAuthStore();

  const handleFinish = async () => {
    await completeOnboarding();
    onNavigate('login');
  };

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="onboarding-screen" data-testid="onboarding-screen-container">
      {/* Botão Pular */}
      <div className="onboarding-top-bar">
        <button
          type="button"
          onClick={handleFinish}
          className="btn-pular"
          data-testid="btn-onboarding-skip"
        >
          PULAR
        </button>
      </div>

      {/* Conteúdo do Slide */}
      <div className="onboarding-card">
        <div className="onboarding-image-container">
          <img src={slide.image} alt={slide.title} className="onboarding-image" />
        </div>

        <div className="onboarding-text-content">
          <span className="onboarding-badge">{slide.subtitle}</span>
          <h2 className="onboarding-title">{slide.title}</h2>
          <p className="onboarding-description">{slide.description}</p>
        </div>

        {/* Indicadores de Slide (Dots) */}
        <div className="onboarding-dots">
          {ONBOARDING_SLIDES.map((_, index) => (
            <div
              key={index}
              data-testid={`onboarding-dot-${index}`}
              className={`onboarding-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* Botão Próximo / Começar */}
        <button
          type="button"
          onClick={handleNext}
          className="btn-onboarding-next"
          data-testid="btn-onboarding-next"
        >
          <span>{currentSlide === ONBOARDING_SLIDES.length - 1 ? 'COMEÇAR AGORA' : 'PRÓXIMO'}</span>
          {currentSlide === ONBOARDING_SLIDES.length - 1 ? (
            <CheckCircle2 size={18} />
          ) : (
            <ArrowRight size={18} />
          )}
        </button>
      </div>
    </div>
  );
};
