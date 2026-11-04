import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from '../../constants/restaurantColors';
import { login } from "../../utils/auth";
import { saveToken } from "../../utils/tokenStorage";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Por favor ingrese usuario y constraseña");
      return;
    }

    try {
      setLoading(true);
      const token = await login(username, password);
      await saveToken(token);
      router.replace("/(app)");
    } catch (error) {
      Alert.alert("Error", "Usuario o constraseña incorrecta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Bienvenido al restaurante</Text>

        <Text style={styles.subtitle}>
          Ingresa tus datos para continuar
        </Text>

        <Text style={styles.label}>Usuario</Text>

        <TextInput
          placeholder="Ingresa tu usuario"
          placeholderTextColor={colors.muted}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          editable={!loading}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>

        <TextInput
          placeholder="Ingresa tu contraseña"
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
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    height: 54,
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
    height: 56,
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