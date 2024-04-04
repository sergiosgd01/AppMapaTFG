import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import styles from '../styles/RegisterScreenStyles';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (!username || !email || !password) {
      setError('Por favor, complete todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingrese un correo electrónico válido');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,20}$/;
    if (!passwordRegex.test(password)) {
      setError('La contraseña debe tener entre 6 y 20 caracteres, al menos una mayúscula, una minúscula y un número');
      return;
    }

    fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/verificar_email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=${email}`,
    })
    .then(response => response.json())
    .then(data => {
      if (data.exists) {
        setError('El correo electrónico ya está registrado');
      } else {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);

        fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/insertar_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            if (rememberMe) {
              AsyncStorage.setItem('userData', JSON.stringify({ email, password }));
            } else {
              AsyncStorage.removeItem('userData');
            }
            navigation.reset({
              index: 0,
              routes: [{ name: 'Events' }],
            });
            navigation.navigate('Events', {
              screen: 'Eventos Pasados',
              params: { user: data.usuario }
            });
            navigation.navigate('Events', {
              screen: 'Eventos Futuros',
              params: { user: data.usuario }
            });
            navigation.navigate('Events', {
              screen: 'Eventos en Directo',
              params: { user: data.usuario }
            });
          } else {
            setError(data.message);
          }
        })
        .catch(error => {
          setError('Error de red, por favor intente de nuevo');
        });
      }
    })
    .catch(error => {
      setError('Error de red, por favor intente de nuevo');
    });
  };

  const handleRememberMePress = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear una cuenta</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de Usuario"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Repetir Contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity onPress={handleRememberMePress} style={styles.checkboxContainer}>
        <CheckBox
          value={rememberMe}
          onValueChange={setRememberMe}
          style={styles.checkbox}
          tintColors={{ true: '#6C21DC', false: 'black' }}
        />
        <Text style={styles.label}>Recuérdame</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

RegisterScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};