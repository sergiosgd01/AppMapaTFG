import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import styles from '../styles/UpcomingEventsScreenStyles';
import * as variables from '../utils/variables';
import { useFocusEffect } from '@react-navigation/native';

export default function UpcomingEventsScreen({ route, navigation }) {
  const user = route.params && route.params.user;
  const [events, setEvents] = useState([]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();

      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }, [])
  );

  useEffect(() => {
    fetchEvents();

    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);

    const backHandler = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
    });

    return () => {
      backHandler();
      clearTimeout(timer);
    };
  }, []);

  const fetchEvents = () => {
    setLoading(true);
    fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_events_organization.php?organizationCode=${encodeURIComponent(variables.organizationCode)}`)
      .then(response => response.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error al obtener los eventos:', error);
        setLoading(false);
      });
  };

  const filterUpcomingEvents = () => {
    const currentDate = new Date();
    return events.filter(events => new Date(events.startDate) > currentDate && events.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleEventPress = (event) => {
    if (user && user.admin === "1") {
      if (event.multiuser === "1") {
		navigation.navigate('MapMultiAdmin', { event: event, fromLiveEvents: false });
	  } else {
		navigation.navigate('MapAdmin', { event: event, fromLiveEvents: false });
	  }
	}
	else {
      Alert.alert(
        'El evento aún no ha comenzado',
        'Este evento aún no ha dado comienzo. Por favor, inténtalo de nuevo más tarde.',
        [
          { text: 'Aceptar', onPress: () => {} },
        ]
      );
	}
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleEventPress(item)} style={styles.eventItem}>
      <View style={styles.eventDetails}>
        <Image source={{ uri: item.image }} style={styles.eventImage} />
        <View style={{ flex: 1 }}>
          <View style={styles.eventInfoContainer}>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.eventName}>{item.name}</Text>
            {item.status == 1 && (
              <View style={styles.cancelledMessage}>
                <Text style={styles.cancelledText}>Evento cancelado</Text>
                <Image source={require('../assets/iconInfo.png')} style={styles.infoIcon} />
              </View>
            )}
            <Text style={styles.eventDateTime}>
              {`Inicio: ${formatDateTime(item.startDate)}`}
            </Text>
            <Text style={styles.eventDateTime}>
              {`Fin: ${formatDateTime(item.endDate)}`}
            </Text>
          </View>
        </View>
	  </View>
    </TouchableOpacity>
  );

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
  };

  return (
    <View style={styles.container}>
      {showWelcomeMessage && user && (
        <View style={styles.welcomeMessage}>
          <Text style={styles.welcomeText}>¡Bienvenido, {user.username}!</Text>
        </View>
      )}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos por nombre"
          onChangeText={setSearchTerm}
          value={searchTerm}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000000" style={styles.spinner} />
      ) : (
        <>
          {filterUpcomingEvents().length == 0 && (
            <View style={styles.noEventsMessage}>
              <Text style={styles.noEventsText}>No hay eventos futuros</Text>
            </View>
          )}
          <FlatList
            data={filterUpcomingEvents()}
            renderItem={renderEventItem}
            keyExtractor={item => item.id.toString()}
          />
        </>
      )}
    </View>
  );
}

UpcomingEventsScreen.propTypes = {
  route: PropTypes.object,
};