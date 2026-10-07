import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { deleteToken, getToken } from '../utils/tokenStorage';


export default function Index() {
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    (async () => {
      await deleteToken(); // Eliminar el token al iniciar la aplicación
      const token = await getToken();
      setIsLoggedIn(!!token);
      setChecked(true);
    })();
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isLoggedIn 
? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}