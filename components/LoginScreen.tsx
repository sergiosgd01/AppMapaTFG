import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckBox from '@react-native-community/checkbox';
import PropTypes from 'prop-types';
import loginImage from '../assets/iconApp.png';
import styles from '../styles/LoginScreenStyles';

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
        setRememberMe(true);
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
      <Image source={loginImage} style={styles.image} />
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
          tintColors={{ true: '#6C21DC', false: 'black' }}
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

LoginScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};
