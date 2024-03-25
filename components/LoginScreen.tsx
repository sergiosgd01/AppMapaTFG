import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckBox from '@react-native-community/checkbox';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userData').then((userData) => {
      if (userData) {
        const { email, password } = JSON.parse(userData);
        setEmail(email);
        setPassword(password);
        setRememberMe(true); // Asegúrate de establecer rememberMe en true para que el checkbox esté marcado
      }
    });
  }, []);

  const handleLogin = () => {
    if (!email || !password) {
      setErrorMessage('Por favor, complete todos los campos');
      return;
    }
    fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_user.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=${email}&password=${password}`,
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        navigation.navigate('Events', { screen: 'Eventos Pasados', params: { user: data.usuario } });
        navigation.navigate('Events', { screen: 'Eventos Futuros', params: { user: data.usuario } });
        navigation.navigate('Events', { screen: 'Eventos en Directo', params: { user: data.usuario } });
        if (rememberMe) {
          AsyncStorage.setItem('userData', JSON.stringify({ email, password }));
        } else {
          AsyncStorage.removeItem('userData');
        }
      } else {
        setErrorMessage(data.message);
      }
    })
    .catch(error => {
      setErrorMessage('Error de red, por favor intente de nuevo');
    });
  };

  const handleContinueWithoutLogin = () => {
    navigation.navigate('Events', { screen: 'Eventos Pasados' });
    navigation.navigate('Events', { screen: 'Eventos Futuros' });
    navigation.navigate('Events', { screen: 'Eventos en Directo' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Events' }],
    });
  };

  const handleCheckboxPress = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity onPress={handleCheckboxPress} style={styles.checkboxContainer}>
        <CheckBox
          value={rememberMe}
          onValueChange={setRememberMe}
          style={styles.checkbox}
          tintColors={{ true: 'blue', false: 'black' }}
        />
        <Text style={styles.label}>Recuérdame</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.continueButton} onPress={handleContinueWithoutLogin}>
        <Text style={styles.continueButtonText}>Continuar sin iniciar sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.registerButtonText}>Crear una cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    borderColor: 'blue',
    borderWidth: 1,
  },
  continueButtonText: {
    color: 'blue',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    borderColor: 'red',
    borderWidth: 1,
  },
  registerButtonText: {
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: 'red',
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  checkbox: {
    alignSelf: 'center',
  },
  label: {
    margin: 8,
    color: 'black',
  },
});
