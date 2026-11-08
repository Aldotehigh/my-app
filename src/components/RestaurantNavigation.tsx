
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';

import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSupplies } from '../context/SuppliesContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import { restaurantBrand } from '../constants/restaurantBrand';

type IconName = ComponentProps<typeof Ionicons>['name'];

type NavigationItemProps = {
  icon: IconName;
  activeIcon: IconName;
  label: string;
  count: number;
  selected: boolean;
  reduceMotion: boolean;
  onPress: () => void;
};

// ---------------------------------------------
// ELEMENTOS ANIMADOS DE LA NAVEGACIÓN
// ---------------------------------------------

function NavigationItem({
  icon,
  activeIcon,
  label,
  count,
  selected,
  reduceMotion,
  onPress,
}: NavigationItemProps) {
  const liftAnimation = useRef(
    new Animated.Value(selected ? 1 : 0)
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      liftAnimation.setValue(selected ? 1 : 0);
      return;
    }

    const animation = Animated.timing(liftAnimation, {
      toValue: selected ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [selected, reduceMotion, liftAnimation]);

  const translateY = liftAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={
        label + (count ? ' · ' + count : '')
      }
      style={styles.item}
      onPress={onPress}
    >
      {/* ICONO CON ANIMACIÓN DE ELEVACIÓN */}
      <Animated.View
        style={{
          transform: [{ translateY }],
        }}
      >
        <View style={styles.iconRow}>
          <Ionicons
            name={selected ? activeIcon : icon}
            size={25}
            color={
              selected
                ? restaurantBrand.cream
                : restaurantBrand.gold
            }
          />

          {count ? (
            <Text style={styles.count}>
              {count}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* NOMBRE DE LA SECCIÓN */}
      <Text
        style={[
          styles.label,
          {
            color: selected
              ? restaurantBrand.cream
              : restaurantBrand.gold,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------
// BARRA DE NAVEGACIÓN INFERIOR
// ---------------------------------------------

export function RestaurantNavigation() {
  const { user } = useAuth();
  const { lines } = useCart();
  const { pendingCount } = useSupplies();

  const { t, colors, reduceMotion } = usePreferences();

  const router = useRouter();
  const path = usePathname();
  const insets = useSafeAreaInsets();

  // ---------------------------------------------
  // ICONOS DE CADA SECCIÓN
  // ---------------------------------------------

  const items = [
    ...(user?.can_view_business
      ? [
          {
            path: '/owner',
            route: '/owner' as const,
            label: 'Dashboard',
            icon: 'stats-chart-outline' as IconName,
            activeIcon: 'stats-chart' as IconName,
          },
        ]
      : []),

    {
      path: '/',
      route: '/(app)' as const,
      label: 'Menu',
      icon: 'home-outline' as IconName,
      activeIcon: 'home' as IconName,
    },

    {
      path: '/table-orders',
      route: '/table-orders' as const,
      label: 'Orders',
      icon: 'receipt-outline' as IconName,
      activeIcon: 'receipt' as IconName,
    },

    ...(user?.role === 'customer'
      ? [
          {
            path: '/reservations',
            route: '/reservations' as const,
            label: 'Reservations',
            icon: 'calendar-outline' as IconName,
            activeIcon: 'calendar' as IconName,
          },
          {
            path: '/favorites',
            route: '/favorites' as const,
            label: 'Favorites',
            icon: 'heart-outline' as IconName,
            activeIcon: 'heart' as IconName,
          },
        ]
      : [
          {
            path: '/supplies',
            route: '/supplies' as const,
            label: 'Supplies',
            icon: 'checkbox-outline' as IconName,
            activeIcon: 'checkbox' as IconName,
          },
        ]),

    {
      path: '/settings',
      route: '/settings' as const,
      label: 'Settings',
      icon: 'settings-outline' as IconName,
      activeIcon: 'settings' as IconName,
    },
  ];

  // ---------------------------------------------
  // SECCIÓN ACTUAL
  // ---------------------------------------------

  const selectedIndex = items.findIndex(
    (item) => item.path === path
  );

  // ---------------------------------------------
  // ANIMACIÓN DE LA RAYITA DORADA
  // ---------------------------------------------

  const [barWidth, setBarWidth] = useState(0);

  const indicatorAnimation = useRef(
    new Animated.Value(
      selectedIndex >= 0 ? selectedIndex : 0
    )
  ).current;

  useEffect(() => {
    if (selectedIndex < 0) {
      return;
    }

    if (reduceMotion) {
      indicatorAnimation.setValue(selectedIndex);
      return;
    }

    const animation = Animated.timing(indicatorAnimation, {
      toValue: selectedIndex,
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [
    selectedIndex,
    reduceMotion,
    indicatorAnimation,
  ]);

  // Cada apartado ocupa el mismo espacio.
  const itemWidth =
    barWidth > 0 ? barWidth / items.length : 0;

  const indicatorTranslateX = Animated.multiply(
    indicatorAnimation,
    itemWidth
  );

  // ---------------------------------------------
  // RENDERIZADO DE LA BARRA
  // ---------------------------------------------

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          borderTopColor: colors.border,
        },
      ]}
    >
      <View
        style={styles.navigationRow}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;

          if (width !== barWidth) {
            setBarWidth(width);
          }
        }}
      >
        {items.map((item) => {
          const selected = path === item.path;

          // Contadores originales
          const count =
            item.label === 'Orders' &&
            user?.role === 'customer'
              ? lines.reduce(
                  (sum, line) => sum + line.quantity,
                  0
                )
              : item.label === 'Supplies'
                ? pendingCount
                : 0;

          return (
            <NavigationItem
              key={item.label}
              icon={item.icon}
              activeIcon={item.activeIcon}
              label={t(item.label)}
              count={count}
              selected={selected}
              reduceMotion={reduceMotion}
              onPress={() => {
                if (!selected) {
                  router.navigate(item.route);
                }
              }}
            />
          );
        })}

        {/* RAYITA DORADA DESLIZANTE */}
        {barWidth > 0 && selectedIndex >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicatorTrack,
              {
                width: itemWidth,
                transform: [
                  {
                    translateX: indicatorTranslateX,
                  },
                ],
              },
            ]}
          >
            <View style={styles.indicator} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------
// ESTILOS ORIGINALES
// ---------------------------------------------

const styles = StyleSheet.create({
  bar: {
    paddingTop: 9,
    paddingHorizontal: 12,
    backgroundColor: restaurantBrand.ink,
    borderTopWidth: 1,
  },

  navigationRow: {
    flexDirection: 'row',
    minHeight: 54,
    position: 'relative',
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: 2,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },

  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  label: {
    fontSize: 11,
    fontWeight: '500',
  },

  indicatorTrack: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  indicator: {
    height: 2,
    width: 24,
    borderRadius: 2,
    backgroundColor: restaurantBrand.gold,
  },

  count: {
    backgroundColor: '#7D251F',
    color: '#FFF6E7',
    paddingHorizontal: 5,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '700',
  },
});
