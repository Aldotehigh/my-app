import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { login } from '../utils/auth';
import { saveToken } from '../utils/tokenStorage';


export default function LoginScreen() {
  const [username,  setUsername] = useState('');
  const [password,  setPassword] = useState('');
  const router = useRouter();
  

  const handleLogin = async () => {
    try {
      const token = await login(username, password);
      await saveToken(token);
      router.replace('/');
    } catch (error){
      Alert.alert('Error', 'Usuario o contraseña incorrectos');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
      placeholder="Usuario"
      value={username}
      onChangeText={setUsername}
      style={styles.input}
      autoCapitalize="none"
    />
    <TextInput
    placeholder="Contraseña"
    value={password}
    onChangeText={setPassword}
    secureTextEntry
    style={styles.input}
    />
    <Button title="Iniciar sesión" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  input:{
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});

  

  