import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingScreenProps {
  navigation: OnboardingNavigationProp;
}

interface SlideItem {
  title: string;
  subtitle: string;
  image: number;
  bulletPoints?: string[];
  isFinal?: boolean;
}

const ONBOARDING_SLIDES: SlideItem[] = [
  {
    title: 'Bem-vindo ao ZOESTOCK',
    subtitle: 'Controle seu estoque operacional com rapidez, organização e auditoria em tempo real.',
    image: require('../../../assets/onboarding/ff3.png'),
  },
  {
    title: 'Entradas e Saídas Simplificadas',
    subtitle: 'Registre movimentações com leitor de código de barras ou bipagem rápida de crachá.',
    bulletPoints: ['Entrada de Materiais', 'Saída de EPIs com CA', 'Devoluções e Transferências'],
    image: require('../../../assets/onboarding/ee5.png'),
  },
  {
    title: 'Inventário em Tempo Real',
    subtitle: 'Faça contagens periódicas no almoxarifado mantendo sincronização mesmo sem internet.',
    bulletPoints: ['Contingência Offline', 'Apuração de Diferenças', 'Auditoria Digital'],
    image: require('../../../assets/onboarding/cc5.png'),
  },
  {
    title: 'Segurança em Primeiro Lugar',
    subtitle: 'Cada movimentação de almoxarifado é registrada com telemetria rigorosa de auditoria.',
    bulletPoints: ['Colaborador Responsável', 'Data e Hora Precisa', 'Identificação do Dispositivo', 'Empresa / Unidade'],
    image: require('../../../assets/onboarding/gg2.png'),
    isFinal: true,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const handleFinish = async () => {
    await completeOnboarding();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const currentSlide = ONBOARDING_SLIDES[currentIndex];

  return (
    <SafeAreaView style={styles.container} testID="onboarding-screen-container">
      {/* Botão Superior Pular */}
      {!currentSlide.isFinal ? (
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleFinish}
            accessibilityRole="button"
            accessibilityLabel="Pular introdução"
            testID="btn-onboarding-skip"
          >
            <Text style={styles.skipText}>PULAR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.topBarPlaceholder} />
      )}

      {/* Imagem do Slide */}
      <View style={styles.imageContainer}>
        <Image
          source={currentSlide.image}
          style={styles.slideImage}
          resizeMode="contain"
          testID={`onboarding-image-${currentIndex}`}
        />
      </View>

      {/* Conteúdo Textual do Slide */}
      <View style={styles.textContainer}>
        <Text style={styles.title} accessibilityRole="header">
          {currentSlide.title}
        </Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>

        {/* Tópicos com Bullet Points */}
        {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 ? (
          <View style={styles.bulletList}>
            {currentSlide.bulletPoints.map((point, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <CheckCircle2 size={16} color={theme.colors.primary} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Controles Inferiores */}
      <View style={styles.bottomBar}>
        {/* Indicadores de Página (Dots) */}
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              testID={`onboarding-dot-${idx}`}
              style={[
                styles.dot,
                currentIndex === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Botão de Ação */}
        {currentSlide.isFinal ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.finalButton}
            onPress={handleFinish}
            accessibilityRole="button"
            accessibilityLabel="Começar agora e ir para o login"
            testID="btn-onboarding-start"
          >
            <Text style={styles.finalButtonText}>COMEÇAR AGORA</Text>
            <ArrowRight size={20} color={theme.colors.textWhite} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.nextCircleButton}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel="Próximo slide"
            testID="btn-onboarding-next"
          >
            <ChevronRight size={28} color={theme.colors.textWhite} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0E',
    justifyContent: 'space-between',
  },
  topBar: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  topBarPlaceholder: {
    height: 48,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  imageContainer: {
    flex: 1,
    maxHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slideImage: {
    width: width * 0.75,
    height: 240,
  },
  textContainer: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  bulletList: {
    gap: 8,
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextCircleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  finalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    elevation: 6,
  },
  finalButtonText: {
    color: theme.colors.textWhite,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
});
