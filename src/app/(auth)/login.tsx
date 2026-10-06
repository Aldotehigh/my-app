import { login } from "@/utils/auth";
import { saveToken } from "@/utils/tokenStorage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

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
      router.replace("/(app)/index");
    } catch (error) {
      Alert.alert("Error", "Usuario o constraseña incorrecta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        editable={!loading}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Constraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        style={styles.input}
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  input: {
    borderRadius: 8,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
});