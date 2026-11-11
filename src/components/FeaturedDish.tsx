
import { useEffect, useRef, useState } from 'react';

import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CardItem } from '../types/CardItem';
import { usePreferences } from '../context/PreferencesContext';
import { getCardSummary } from '../utils/cardPresentations';
import { restaurantBrand } from '../constants/restaurantBrand';

type FeaturedDishProps = {
  cards: CardItem[];
  onPress: (card: CardItem) => void;
};

export function FeaturedDish({
  cards,
  onPress,
}: FeaturedDishProps) {
  const { t, reduceMotion, isDark } = usePreferences();

  const [activeIndex, setActiveIndex] = useState(0);

  const [failedImages, setFailedImages] =
    useState<(string | number)[]>([]);

  // ============================================
  // ANIMACIONES ORIGINALES DE LOS TEXTOS
  // ============================================

  const eyebrowAnim = useRef(
    new Animated.Value(0)
  ).current;

  const titleAnim = useRef(
    new Animated.Value(0)
  ).current;

  const ruleAnim = useRef(
    new Animated.Value(0)
  ).current;

  const priceAnim = useRef(
    new Animated.Value(0)
  ).current;

  const buttonAnim = useRef(
    new Animated.Value(0)
  ).current;

  // Oscurecimiento gradual de la fotografía
  const shadeAnim = useRef(
    new Animated.Value(0.22)
  ).current;

  // Transición entre fotografías
  const imageOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const animationRef =
    useRef<Animated.CompositeAnimation | null>(null);

  // Detectar movimientos horizontales
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastSwipeAt = useRef(0);

  // ============================================
  // IDENTIFICADORES DE LAS TARJETAS
  // ============================================

  const cardsKey = cards
    .map((item) => item.id)
    .join(',');

  const count = cards.length;

  const currentIndex =
    count > 0 ? activeIndex % count : 0;

  const currentCard = cards[currentIndex];

  const summary = currentCard
    ? getCardSummary(currentCard)
    : null;

  // ============================================
  // CAMBIAR DE PLATILLO MANUALMENTE
  // ============================================

  const changeCard = (nextIndex: number) => {
    if (count <= 1) return;

    const normalizedIndex =
      (nextIndex + count) % count;

    if (normalizedIndex === currentIndex) {
      return;
    }

    animationRef.current?.stop();

    setActiveIndex(normalizedIndex);
  };

  // ============================================
  // ANIMACIÓN COMPLETA DE CADA PLATILLO
  // ============================================

  useEffect(() => {
    if (count === 0) return;

    const elements = [
      eyebrowAnim,
      titleAnim,
      ruleAnim,
      priceAnim,
      buttonAnim,
    ];

    // Reiniciar los textos
    elements.forEach((value) => {
      value.setValue(0);
    });

    shadeAnim.setValue(0.22);
    imageOpacity.setValue(0);

    // Respetar reducción de movimiento
    if (reduceMotion) {
      elements.forEach((value) => {
        value.setValue(1);
      });

      shadeAnim.setValue(1);
      imageOpacity.setValue(1);

      return;
    }

    // Aparición de la fotografía
    const showImage = Animated.timing(
      imageOpacity,
      {
        toValue: 1,
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }
    );

    // Entrada escalonada de los textos
    const enter = elements.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    // Salida de los textos
    const exit = elements.map((value) =>
      Animated.timing(value, {
        toValue: 2,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      })
    );

    // ==========================================
    // SECUENCIA ORIGINAL DEL CARRUSEL
    // ==========================================

    const animation = Animated.sequence([
      // 1. Aparece la fotografía
      showImage,

      // 2. Fotografía sola
      Animated.delay(1500),

      // 3. Oscurecimiento gradual
      Animated.timing(shadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),

      // 4. Entran los textos uno por uno
      Animated.stagger(200, enter),

      // 5. Permanecen visibles
      Animated.delay(3000),

      // 6. Salen los textos
      Animated.parallel([
        ...exit,

        Animated.timing(shadeAnim, {
          toValue: 0.22,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // 7. Se aprecia nuevamente la fotografía
      Animated.delay(700),

      // 8. Desaparece suavemente
      Animated.timing(imageOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animationRef.current = animation;

    animation.start(({ finished }) => {
      if (finished && count > 1) {
        setActiveIndex(
          (previous) => (previous + 1) % count
        );
      }
    });

    return () => {
      animation.stop();
    };
  }, [
    currentIndex,
    cardsKey,
    count,
    reduceMotion,
    eyebrowAnim,
    titleAnim,
    ruleAnim,
    priceAnim,
    buttonAnim,
    shadeAnim,
    imageOpacity,
  ]);

  // ============================================
  // ESTILO ANIMADO DE LOS TEXTOS
  // ============================================

  const animatedStyle = (value: Animated.Value) => ({
    opacity: value.interpolate({
      inputRange: [0, 0.7, 1, 1.3, 2],
      outputRange: [0, 1, 1, 1, 0],
    }),

    transform: [
      {
        translateX: value.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [-65, 0, -65],
        }),
      },
    ],
  });

  // ============================================
  // DESLIZAR ENTRE PLATILLOS
  // ============================================

  const handleTouchStart = (
    x: number,
    y: number
  ) => {
    touchStartX.current = x;
    touchStartY.current = y;
  };

  const handleTouchEnd = (
    x: number,
    y: number
  ) => {
    const distanceX = x - touchStartX.current;
    const distanceY = y - touchStartY.current;

    // Ignorar movimientos verticales
    if (
      Math.abs(distanceX) < 55 ||
      Math.abs(distanceX) <= Math.abs(distanceY) * 1.4
    ) {
      return;
    }

    lastSwipeAt.current = Date.now();

    if (distanceX < 0) {
      changeCard(currentIndex + 1);
    } else {
      changeCard(currentIndex - 1);
    }
  };

  if (!currentCard || !summary) {
    return null;
  }

  const imageFailed = failedImages.includes(
    currentCard.id
  );

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          t('Discover a dish') +
          '. ' +
          t(summary.title) +
          '. ' +
          summary.price +
          ' MXN'
        }
        onPress={() => {
          // No abrir detalles después de deslizar
          if (
            Date.now() - lastSwipeAt.current < 500
          ) {
            return;
          }

          onPress(currentCard);
        }}
        onTouchStart={(event) => {
          handleTouchStart(
            event.nativeEvent.pageX,
            event.nativeEvent.pageY
          );
        }}
        onTouchEnd={(event) => {
          handleTouchEnd(
            event.nativeEvent.pageX,
            event.nativeEvent.pageY
          );
        }}
        style={[
          styles.panel,

          // ====================================
          // BORDE DORADO SOLO EN MODO OSCURO
          // ====================================
          isDark && styles.darkPanel,
        ]}
      >
        {/* FOTOGRAFÍA DEL PLATILLO */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.imageContainer,
            {
              opacity: imageOpacity,
            },
          ]}
        >
          {summary.image && !imageFailed ? (
            <Image
              accessible={false}
              source={{
                uri: summary.image,
              }}
              style={styles.image}
              onError={() => {
                setFailedImages((previous) =>
                  previous.includes(currentCard.id)
                    ? previous
                    : [...previous, currentCard.id]
                );
              }}
            />
          ) : null}
        </Animated.View>

        {/* SOMBRA GRADUAL */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shade,
            {
              opacity: shadeAnim,
            },
          ]}
        />

        {/* ==================================== */}
        {/* CONTENIDO ANIMADO */}
        {/* ==================================== */}

        <View
          pointerEvents="none"
          style={styles.content}
        >
          {/* 1. PARA DESCUBRIR */}
          <Animated.View
            style={animatedStyle(eyebrowAnim)}
          >
            <Text style={styles.eyebrow}>
              {t('DISCOVER')}
            </Text>
          </Animated.View>

          {/* 2. NOMBRE DEL PLATILLO */}
          <Animated.View
            style={animatedStyle(titleAnim)}
          >
            <Text
              style={styles.title}
              numberOfLines={3}
            >
              {t(summary.title)}
            </Text>
          </Animated.View>

          {/* 3. LÍNEA DECORATIVA */}
          <Animated.View
            style={animatedStyle(ruleAnim)}
          >
            <View style={styles.rule} />
          </Animated.View>

          {/* 4. PRECIO */}
          <Animated.View
            style={animatedStyle(priceAnim)}
          >
            <Text style={styles.price}>
              {summary.showStartingPrice
                ? t('From') + ' '
                : ''}
              ${summary.price}{' '}
              <Text style={styles.currency}>
                MXN
              </Text>
            </Text>
          </Animated.View>

          {/* 5. VER DETALLE */}
          <Animated.View
            style={animatedStyle(buttonAnim)}
          >
            <View style={[styles.link, isDark && styles.darkLink]}>
              <Text style={styles.linkText}>
                {t('View details ›')}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Pressable>

      {/* ==================================== */}
      {/* INDICADORES DEL CARRUSEL */}
      {/* ==================================== */}

      {count > 1 ? (
        <View style={styles.pagination}>
          {cards.map((item, index) => {
            const selected = index === currentIndex;

            return (
              <Pressable
                key={String(item.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  `Mostrar platillo ${index + 1}`
                }
                accessibilityState={{
                  selected,
                }}
                onPress={() => changeCard(index)}
                style={styles.dotTouch}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: selected ? 22 : 6,

                      backgroundColor: selected
                        ? '#79251F'
                        : '#CBB9A6',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  container: {
    marginTop: 9,
    marginBottom: 8,
  },

  // Diseño original de la tarjeta
  panel: {
    minHeight: 195,
    backgroundColor: '#211914',
    borderRadius: 18,
    overflow: 'hidden',
  },

  // NUEVO: contorno dorado exclusivo del modo oscuro
  darkPanel: {
    borderWidth: 1,
    borderColor: '#78502D',
  },

  imageContainer: {
    ...StyleSheet.absoluteFill,
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  shade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 9, 6, 0.62)',
  },

  content: {
    padding: 22,
    alignItems: 'flex-start',
    gap: 9,
  },

  eyebrow: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: restaurantBrand.gold,
    fontWeight: '700',
  },

  title: {
    fontSize: 29,
    lineHeight: 33,
    fontFamily: restaurantBrand.serif,
    color: restaurantBrand.cream,
    maxWidth: '82%',
  },

  rule: {
    width: 28,
    height: 1,
    backgroundColor: restaurantBrand.gold,
    marginVertical: 3,
  },

  price: {
    fontSize: 23,
    fontFamily: restaurantBrand.serif,
    color: restaurantBrand.gold,
  },

  currency: {
    fontSize: 11,
  },

  link: {
  borderRadius: 22,
  backgroundColor: '#79251F',
  paddingHorizontal: 17,
  minHeight: 38,
  justifyContent: 'center',
  marginTop: 2,
},

darkLink: {
  backgroundColor: '#801C18',
  borderTopWidth: 1,
  borderTopColor: '#A34437',
  borderBottomWidth: 1,
  borderBottomColor: '#9B392A',
  borderLeftWidth: 0.5,
  borderRightWidth: 0.5,
  borderLeftColor: '#84241D',
  borderRightColor: '#84241D',
},

linkText: {
  color: restaurantBrand.cream,
  fontSize: 13,
  fontFamily: restaurantBrand.serif,
},
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    gap: 5,
  },

  dotTouch: {
    minWidth: 25,
    minHeight: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    height: 6,
    borderRadius: 3,
  },
});
