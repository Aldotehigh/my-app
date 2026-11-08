
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

export function FeaturedDish({
  card,
  onPress,
}: {
  card: CardItem;
  onPress: () => void;
}) {
  const { t } = usePreferences();
  const summary = getCardSummary(card);

  const [failed, setFailed] = useState(false);

  // Animaciones individuales de cada elemento
  const eyebrowAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const ruleAnim = useRef(new Animated.Value(0)).current;
  const priceAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Oscurecimiento gradual de la fotografía
  const shadeAnim = useRef(new Animated.Value(0.22)).current;

  useEffect(() => {
    const elements = [
      eyebrowAnim,
      titleAnim,
      ruleAnim,
      priceAnim,
      buttonAnim,
    ];

    const enter = elements.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    const exit = elements.map((value) =>
      Animated.timing(value, {
        toValue: 2,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      })
    );

    const reset = elements.map((value) =>
      Animated.timing(value, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      })
    );

    const animation = Animated.loop(
      Animated.sequence([
        // La fotografía aparece sola al principio
        Animated.delay(1500),

        // El fondo se oscurece suavemente
        Animated.timing(shadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        // Los textos aparecen uno después de otro
        Animated.stagger(200, enter),

        // Se mantienen visibles
        Animated.delay(3000),

        // Los elementos se retiran hacia la izquierda
        Animated.parallel([
          ...exit,
          Animated.timing(shadeAnim, {
            toValue: 0.22,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),

        // Restablece las posiciones sin mostrar los textos
        Animated.parallel(reset),

        // Deja ver nuevamente la fotografía
        Animated.delay(900),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    eyebrowAnim,
    titleAnim,
    ruleAnim,
    priceAnim,
    buttonAnim,
    shadeAnim,
  ]);

  // Desplazamiento de izquierda a derecha al entrar
  // y de derecha a izquierda al salir.
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        t('Discover a dish') +
        '. ' +
        summary.title +
        '. ' +
        summary.price +
        ' MXN'
      }
      onPress={onPress}
      style={styles.panel}
    >
      {/* Fotografía original del platillo */}
      {summary.image && !failed ? (
        <Image
          accessible={false}
          source={{ uri: summary.image }}
          style={styles.image}
          onError={() => setFailed(true)}
        />
      ) : null}

      {/* Sombra gradual para mejorar la lectura */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shade,
          { opacity: shadeAnim },
        ]}
      />

      <View style={styles.content}>
        {/* 1. PARA DESCUBRIR */}
        <Animated.View style={animatedStyle(eyebrowAnim)}>
          <Text style={styles.eyebrow}>
            {t('DISCOVER')}
          </Text>
        </Animated.View>

        {/* 2. Nombre del platillo */}
        <Animated.View style={animatedStyle(titleAnim)}>
          <Text style={styles.title} numberOfLines={3}>
            {summary.title}
          </Text>
        </Animated.View>

        {/* 3. Línea decorativa */}
        <Animated.View style={animatedStyle(ruleAnim)}>
          <View style={styles.rule} />
        </Animated.View>

        {/* 4. Precio */}
        <Animated.View style={animatedStyle(priceAnim)}>
          <Text style={styles.price}>
            {summary.showStartingPrice
              ? t('From') + ' '
              : ''}
            ${summary.price}{' '}
            <Text style={styles.currency}>MXN</Text>
          </Text>
        </Animated.View>

        {/* 5. Botón Ver detalle */}
        <Animated.View style={animatedStyle(buttonAnim)}>
          <View style={styles.link}>
            <Text style={styles.linkText}>
              {t('View details ›')}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 195,
    backgroundColor: '#211914',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 22,
    marginBottom: 8,
  },

  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

  linkText: {
    color: restaurantBrand.cream,
    fontSize: 13,
    fontFamily: restaurantBrand.serif,
  },
});
