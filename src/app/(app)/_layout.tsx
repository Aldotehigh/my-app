
import { ReservationUpdates } from '../../context/ReservationUpdates';
import { SuppliesProvider } from '../../context/SuppliesContext';
import { RestaurantNavigation } from '../../components/RestaurantNavigation';
import { Image, View, ActivityIndicator, Button, Text } from 'react-native';
import { OrdersProvider, OrderInboxButton } from '../../context/OrdersContext';
import { CartProvider } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { deleteToken } from '../../utils/tokenStorage';

function JapaneseWaves({
  isDark,
}: {
  isDark: boolean;
}) {
  if (!isDark) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        width: 194,
        height: 65,
        marginRight: -16,
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <Image
        accessible={false}
        source={require('../../../assets/images/ondas_japonesas.png')}
        resizeMode="stretch"
        style={{
          width: '100%',
          height: 84,
          opacity: 0.65,
        }}
      />
    </View>
  );
}

function HeaderWithWaves({
  isDark,
  showOrdersButton,
}: {
  isDark: boolean;
  showOrdersButton: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <JapaneseWaves isDark={isDark} />

      {showOrdersButton ? (
        <OrderInboxButton />
      ) : null}
    </View>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <AuthenticatedNavigator />
    </AuthProvider>
  );
}

function AuthenticatedNavigator() {
  const { colors, t, reduceMotion, isDark } = usePreferences();
  const { user, loading, error, reloadUser } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.accent} />

        <Text style={{ color: colors.text }}>
          {t('Loading profile...')}
        </Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          gap: 16,
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.text }}>
          {t('Could not load your profile. Check your connection or sign in again.')}
        </Text>

        <Button
          color={colors.accent}
          title={t('Retry')}
          onPress={() => void reloadUser()}
        />

        <Button
          color={colors.accent}
          title={t('Sign out')}
          onPress={async () => {
            await deleteToken();
            router.replace('/(auth)/login');
          }}
        />
      </View>
    );
  }

  return (
    <CartProvider key={user.id}>
      <SuppliesProvider>
        <OrdersProvider>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={({ route }) => ({
                contentStyle: {
                  backgroundColor: colors.background,
                },
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: isDark
                  ? '#801C18'
                  : colors.accent,
                headerTitleStyle: {
                  color: colors.text,
                  fontWeight: '700',
                },
                headerShadowVisible: false,
                ...(user.role === 'customer' ||
                route.name === 'settings'
                  ? {}
                  : {
                      headerRight: () => (
                        <OrderInboxButton />
                      ),
                    }),
                animation: reduceMotion
                  ? 'none'
                  : 'default',
              })}
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                  title: t(
                    user.can_manage_menu
                      ? 'Manage menu'
                      : user.area === 'kitchen'
                        ? 'Kitchen'
                        : user.area === 'bar'
                          ? 'Drinks bar'
                          : user.area === 'sushi'
                            ? 'Sushi'
                            : 'Restaurant menu'
                  ),
                }}
              />

              <Stack.Screen
                name="form"
                options={{
                  title: t(
                    user.area === 'bar'
                      ? 'Manage drink'
                      : 'Manage dish'
                  ),
                }}
              />

              <Stack.Screen
                name="details"
                options={{
                  title: t('Details'),
                  headerTintColor: isDark
                    ? '#801C18'
                    : colors.accent,
                  headerShadowVisible: false,
                  headerRight: () => (
                    <HeaderWithWaves
                      isDark={isDark}
                      showOrdersButton={
                        user.role !== 'customer'
                      }
                    />
                  ),
                }}
              />

              <Stack.Screen
                name="favorites"
                options={{
                  title: t('My favorites'),
                  headerTintColor: isDark
                    ? '#801C18'
                    : colors.accent,
                  headerShadowVisible: false,
                  headerRight: () => (
                    <HeaderWithWaves
                      isDark={isDark}
                      showOrdersButton={
                        user.role !== 'customer'
                      }
                    />
                  ),
                }}
              />

              <Stack.Screen
                name="accessibility"
                options={{
                  title: t('Accessibility'),
                }}
              />

              <Stack.Screen
                name="profile"
                options={{
                  title: t('My profile'),
                  headerTintColor: isDark
                    ? '#801C18'
                    : colors.accent,
                  headerShadowVisible: false,
                  headerRight: () => (
                    <HeaderWithWaves
                      isDark={isDark}
                      showOrdersButton={
                        user.role !== 'customer'
                      }
                    />
                  ),
                }}
              />

              <Stack.Screen
                name="settings"
                options={{
                  title: t('Settings'),
                  headerTintColor: isDark
                    ? '#801C18'
                    : colors.accent,
                  headerShadowVisible: false,
                  headerRight: () => (
                    <HeaderWithWaves
                      isDark={isDark}
                      showOrdersButton={false}
                    />
                  ),
                }}
              />

              <Stack.Screen
                name="owner"
                options={{
                  title: t('Owner dashboard'),
                }}
              />

              <Stack.Screen
                name="reservations"
                options={{
                  title: t('Reservations'),
                  headerTintColor: isDark
                    ? '#801C18'
                    : colors.accent,
                  headerShadowVisible: false,
                  headerRight: () => (
                    <HeaderWithWaves
                      isDark={isDark}
                      showOrdersButton={
                        user.role !== 'customer'
                      }
                    />
                  ),
                }}
              />

              <Stack.Screen
                name="inventory"
                options={{
                  title: t('Inventory'),
                }}
              />

              <Stack.Screen
                name="supplies"
                options={{
                  title: t('Supplies'),
                }}
              />

              <Stack.Screen
                name="table-orders"
                options={{
                  title: t('Orders'),
                  headerTintColor: isDark
                    ? '#801C18'
                    : colors.accent,
                  headerShadowVisible: false,
                  headerRight: () => (
                    <HeaderWithWaves
                      isDark={isDark}
                      showOrdersButton={
                        user.role !== 'customer'
                      }
                    />
                  ),
                }}
              />
            </Stack>

            <ReservationUpdates />
            <RestaurantNavigation />
          </View>
        </OrdersProvider>
      </SuppliesProvider>
    </CartProvider>
  );
}
