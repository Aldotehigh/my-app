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

    Alert.alert(password);

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
        <Text style={styles.title}>Iniciar Sesión</Text>

        <Text style={styles.subtitle}>
          Ingresa tus datos para continuar
        </Text>

        <Text style={styles.label}>Usuario</Text>

        <TextInput
          placeholder="Ingresa tu usuario"
          placeholderTextColor="#777"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          editable={!loading}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>

        <TextInput
          placeholder="Ingresa tu contraseña"
          placeholderTextColor="#777"
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
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loginContainer: {
    width: "100%",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 36,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderRadius: 12,
    borderColor: "#000000",
    borderWidth: 1,
    marginBottom: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },

  button: {
    height: 56,
    backgroundColor: "#000000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});