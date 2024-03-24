import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import provincias from '../provincias';

export default function LiveEventsScreen({ route, navigation }) {
  const user = route.params && route.params.user;

  const [selectedProvince, setSelectedProvince] = useState(user ? user.province : 'Álava');
  const [events, setEvents] = useState([]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);

    // Intercepta el evento de retroceso físico solo en LiveEventsScreen
    const backHandler = navigation.addListener('beforeRemove', (e) => {
      // Evita que el evento de retroceso físico tenga efecto
      e.preventDefault();
    });

    // Limpia el listener al desmontar el componente
    return () => {
      backHandler();
      clearTimeout(timer);
    };

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

  const filterLiveEvents = () => {
    const currentDate = new Date();
    return events.filter(event => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const isEventLive = eventStartDate <= currentDate && eventEndDate >= currentDate;
      const matchesSearchTerm = event.name.toLowerCase().includes(searchTerm.toLowerCase());
      return isEventLive && matchesSearchTerm;
    });
  };

  const handleEventPress = (event) => {
    if (event.multiuser === "1") {
      navigation.navigate('MapMulti', { event: event, fromLiveEvents: true });
    } else {
      navigation.navigate('Map', { event: event, fromLiveEvents: true });
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
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
        <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />
      ) : (
        <>
          {events.length === 0 && (
            <View style={styles.noEventsMessage}>
              <Text style={styles.noEventsText}>No hay eventos en directo en {selectedProvince}</Text>
            </View>
          )}
          <FlatList
            data={filterLiveEvents()}
            renderItem={renderEventItem}
            keyExtractor={item => item.id.toString()}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  eventDetails: {
    flexDirection: 'row',
  },
  eventImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    top: 0,
    marginBottom: 5,
  },
  eventDateTime: {
    fontSize: 16,
    color: '#666',
  },
  picker: {
    width: '40%',
    height: 40,
    marginBottom: 10,
  },
  noEventsMessage: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  welcomeMessage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius:
5,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    height: 40,
    width: '60%',
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
