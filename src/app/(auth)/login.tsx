import { usePreferences } from '../../context/PreferencesContext';
import type { RestaurantColors } from '../../constants/restaurantColors';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { login } from "../../utils/auth";
import { saveToken } from "../../utils/tokenStorage";

export default function LoginScreen() {
  const { colors, t, isDark } = usePreferences();
  const styles = createStyles(colors);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t("Error"), t("Enter your username and password"));
      return;
    }

    try {
      setLoading(true);
      const token = await login(username, password);
      await saveToken(token);
      router.replace("/(app)");
    } catch (error) {
      Alert.alert(t("Error"), t("Incorrect username or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.title}>{t("Welcome to the restaurant")}</Text>

        <Text style={styles.subtitle}>
          {t("Enter your details to continue")}</Text>

        <Text style={styles.label}>{t("Username")}</Text>

        <TextInput keyboardAppearance={isDark ? 'dark' : 'light'}
          accessibilityLabel={t("Username")}
          autoComplete="username"
          placeholder={t("Enter your username")}
          placeholderTextColor={colors.muted}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          editable={!loading}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t("Password")}</Text>

        <TextInput
          accessibilityLabel={t("Password")}
          autoComplete="current-password"
          placeholder={t("Enter your password")}
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          style={styles.input}
        />

        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>{t("Sign in")}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: RestaurantColors) => StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 24,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loginContainer: {
    width: "100%",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 36,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },

  input: {
    minHeight: 54,
    paddingVertical: 14,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  button: {
    minHeight: 56,
    paddingVertical: 14,
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: "700",
  },
});