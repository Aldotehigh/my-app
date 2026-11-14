
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';

import {
  useFonts,
  Montserrat_500Medium,
} from '@expo-google-fonts/montserrat';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '../context/PreferencesContext';
import { restaurantBrand } from '../constants/restaurantBrand';
import { OrderInboxButton } from '../context/OrdersContext';

const woodBackground = require('../../assets/images/madera.jpg');
const imageSize = Image.resolveAssetSource(woodBackground);

// =============================================
// TRÉBOL DE CUATRO PÉTALOS
// =============================================

function YotsubaFlower() {
  return (
    <Svg width={47} height={47} viewBox="0 0 100 100">
      {[0, 90, 180, 270].map((angle) => (
        <Path
          key={angle}
          d="
            M 50 46
            C 43 39, 32 32, 32 22
            C 32 12, 43 9, 50 19
            C 57 9, 68 12, 68 22
            C 68 32, 57 39, 50 46
            Z
          "
          fill="#F0D9BB"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
    </Svg>
  );
}

// =============================================
// ENCABEZADO DE YOTSUBA
// =============================================

export function RestaurantMasthead() {
  const { t, colors, isDark } = usePreferences();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Tipografía Montserrat Medium 500
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
  });

  // Conserva las proporciones originales de la madera
  const imageHeight =
    width * (imageSize.height / imageSize.width);

  // Adapta el nombre al ancho del teléfono
  const brandFontSize =
    width < 360 ? 21 : width < 410 ? 24 : 27;

  return (
    <View style={styles.hero}>
      <ImageBackground
        source={woodBackground}
        resizeMode="contain"
        style={[
          styles.background,
          {
            width,
            height: imageHeight,
          },
        ]}
      >
        {/* BOTÓN DE PEDIDOS */}
        <View
          style={[
            styles.tools,
            { top: insets.top + 8 },
          ]}
        >
          <OrderInboxButton />
        </View>

        {/* LOGOTIPO Y NOMBRE */}
        <View
          style={[
            styles.brandContainer,
            {
              transform: [{ translateY: -10 }],
            },
          ]}
        >
          <YotsubaFlower />

          <Text
            accessibilityRole="header"
            style={[
              styles.brand,
              {
                fontSize: brandFontSize,
                fontFamily: fontsLoaded
                  ? 'Montserrat_500Medium'
                  : undefined,
                fontWeight: fontsLoaded
                  ? undefined
                  : '500',
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            YOTSUBA
          </Text>

          <Text
            style={styles.tagline}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t(restaurantBrand.tagline)}
          </Text>
        </View>
      </ImageBackground>

      {/* ===================================== */}
      {/* ONDA INFERIOR */}
      {/* ===================================== */}

      <View
        pointerEvents="none"
        style={styles.waveContainer}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 65"
          preserveAspectRatio="none"
        >
          {/* FONDO DE LA ONDA */}
          <Path
            d="
              M 0 12
              C 76 10, 120 14, 176 19
              C 242 26, 292 39, 338 44
              C 361 47, 385 49, 400 46
              L 400 65
              L 0 65
              Z
            "
            fill={colors.background}
          />

          {/* CONTORNO DORADO: SOLO MODO OSCURO */}
          {isDark ? (
            <Path
              d="
                M 0 12
                C 76 10, 120 14, 176 19
                C 242 26, 292 39, 338 44
                C 361 47, 385 49, 400 46
              "
              fill="none"
              stroke="#D8B067"
              strokeWidth={1.2}
              strokeOpacity={0.85}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </View>
    </View>
  );
}

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    backgroundColor: '#211510',
    overflow: 'hidden',
  },

  background: {
    alignSelf: 'center',
    backgroundColor: '#211510',
    justifyContent: 'center',
  },

  tools: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    zIndex: 10,
  },

  brandContainer: {
    width: '100%',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  brand: {
    color: '#F3DEC5',
    letterSpacing: 7,
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: 3,
  },

  tagline: {
    color: '#E1C3A6',
    fontFamily: restaurantBrand.serif,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },

  waveContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 65,
    zIndex: 5,
  },
});
