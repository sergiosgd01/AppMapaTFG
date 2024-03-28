import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import provincias from '../provincias';
import PropTypes from 'prop-types';

export default function PastEventsScreen({ route, navigation }) {
  const user = route.params && route.params.user;

  const [selectedProvince, setSelectedProvince] = useState(user ? user.province : 'Álava');
  const [events, setEvents] = useState([]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();

    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [selectedProvince]);

  const fetchEvents = () => {
    setLoading(true);
    fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_events_province.php?province=${encodeURIComponent(selectedProvince)}`)
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

  const filterPastEvents = () => {
    const currentDate = new Date();
    return events.filter(event => new Date(event.endDate) < currentDate && event.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleEventPress = (event) => {
    if (event.multiuser === "1") {
      navigation.navigate('MapMulti', { event: event });
    } else {
      navigation.navigate('Map', { event: event });
    }
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleEventPress(item)} style={styles.eventItem}>
      <View style={styles.eventDetails}>
        <Image source={{ uri: item.image }} style={styles.eventImage} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.eventName}>{item.name}</Text>
          <Text style={styles.eventDateTime}>
            {`Fecha de inicio: ${formatDateTime(item.startDate)}`}
          </Text>
          <Text style={styles.eventDateTime}>
            {`Fecha de fin: ${formatDateTime(item.endDate)}`}
          </Text>
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
        <Picker
          selectedValue={selectedProvince}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedProvince(itemValue)}
        >
          {Object.keys(provincias).map((provincia) => (
            <Picker.Item key={provincia} label={provincia} value={provincia} />
          ))}
        </Picker>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000000" style={styles.spinner} />
      ) : (
        <>
          {events.length === 0 && (
            <View style={styles.noEventsMessage}>
              <Text style={styles.noEventsText}>No hay eventos pasados en {selectedProvince}</Text>
            </View>
          )}
          <FlatList
            data={filterPastEvents()}
            renderItem={renderEventItem}
            keyExtractor={item => item.id.toString()}
          />
        </>
      )}
    </View>
  );
}

PastEventsScreen.propTypes = {
  route: PropTypes.object,
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventDateTime: {
    color: '#666',
    fontSize: 16,
  },
  eventDetails: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  eventImage: {
    borderRadius: 10,
    height: 100,
    marginRight: 10,
    width: 100,
  },
  eventItem: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 20,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noEventsMessage: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noEventsText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    height: 40,
    marginBottom: 10,
    width: '40%',
  },
  searchInput: {
    borderColor: 'gray',
    borderWidth: 1,
    height: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '60%',
  },
  spinner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  welcomeMessage: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    bottom: 0,
    elevation: 3,
    left: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  welcomeText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
