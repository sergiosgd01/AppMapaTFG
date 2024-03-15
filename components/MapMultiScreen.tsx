import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import provincias from '../provincias';

// Componente personalizado para el marcador con el número de dorsal dentro de un círculo
const CustomMarker = ({ coordinate, dorsal, color, name, onPress }) => (
  <Marker coordinate={coordinate} onPress={onPress}>
    <View style={[styles.markerContainer, { backgroundColor: color }]}>
      <View style={styles.marker}>
        <Text style={styles.markerText}>{dorsal}</Text>
      </View>
    </View>
    {name && ( // Verificar si name no es null antes de renderizar el Callout
      <Callout style={styles.calloutContainer}>
        <Text style={styles.calloutText}>{name}</Text>
      </Callout>
    )}
  </Marker>
);

export default function MapMultiScreen({ route, navigation }) {
  const { event, fromLiveEvents } = route.params;
  const [userLocations, setUserLocations] = useState([]);
  const [eventSchedule, setEventSchedule] = useState('');
  const [formattedLastMarkerTime, setFormattedLastMarkerTime] = useState('');
  const [selectedDorsal, setSelectedDorsal] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar la carga
  const uniqueDorsals = [...new Set(userLocations.map(location => location.dorsal))];
  const allOption = 'Todos';
  const allDorsals = [allOption, ...uniqueDorsals];
  const [showRoute, setShowRoute] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const mapRef = useRef(null);
  const [showServices, setShowServices] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('fetchData');
      await fetchUserLocations();
      await fetchRouteMarkers();
      setIsLoading(false);
    };

    fetchData();

    if (fromLiveEvents) {
      const TIME_DISTANCE = event.time_distance;
      const [time, distance] = TIME_DISTANCE.split('-').map(Number);
      if (time == 0) {
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
      }
      else {
        const interval = setInterval(fetchData, time * 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  useEffect(() => {
    // Centrar el mapa en la ubicación del dorsal seleccionado
    if (userLocations.length > 0) {
      if (selectedDorsal === allOption) {
        // Mostrar la última ubicación recibida de todos los dorsales
        const lastLocation = userLocations[userLocations.length - 1];
        mapRef.current.animateToRegion({
          latitude: parseFloat(lastLocation.latitude),
          longitude: parseFloat(lastLocation.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      } else {
        // Mostrar la ubicación del dorsal seleccionado
        const selectedLocations = userLocations.filter(location => location.dorsal === selectedDorsal);
        const lastLocation = selectedLocations[selectedLocations.length - 1]; // Cambio aquí
        if (lastLocation) { // Añadir este control para evitar errores si no hay ubicaciones para el dorsal seleccionado
          mapRef.current.animateToRegion({
            latitude: parseFloat(lastLocation.latitude),
            longitude: parseFloat(lastLocation.longitude),
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
      }
    }
  }, [selectedDorsal, userLocations]);

  const fetchUserLocations = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_location.php?code=${event.code}`);
      const markers = await response.json();
      setUserLocations(markers);
      if (markers.length > 0) {
        setFormattedLastMarkerTime(markers[markers.length - 1].timestamp);
        // Actualizar la región inicial solo si no está definida
        if (!initialRegion) {
          setInitialRegion(calculateInitialRegion(markers));
        }
      } else {
        const province = provincias[event.province];
        if (province) {
          // Actualizar la región inicial solo si no está definida
          if (!initialRegion) {
            setInitialRegion(calculateInitialRegion([], province.lat, province.lng));
          }
        } else {
          // Actualizar la región inicial solo si no está definida
          if (!initialRegion) {
            setInitialRegion(calculateInitialRegion([], 40.4168, -3.7038));
          }
        }
      }
      setEventSchedule(`${formatDate(event.startDate)} ${formatTime(event.startDate)} - ${formatDate(event.endDate)} ${formatTime(event.endDate)}`);
      navigation.setOptions({ title: event.name });
    } catch (error) {
      console.error('Error al obtener los marcadores de ubicación:', error);
    }
  };

  const fetchRouteMarkers = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_route_code.php?code=${event.code}`);
      const markers = await response.json();
      setRouteMarkers(markers);
    } catch (error) {
      console.error('Error al obtener los marcadores de la ruta:', error);
    }
  };

  const fetchServiceLocations = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_service_code.php?code=${event.code}`);
      const locations = await response.json();
      setServiceLocations(locations);
    } catch (error) {
      console.error('Error al obtener las ubicaciones de los servicios:', error);
    }
  };

  const handleShowServices = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_service_code.php?code=${event.code}`);
      const locations = await response.json();
      if (locations.length === 0) {
      Alert.alert(
        'Sin servicios',
        'No hay servicios disponibles en este evento.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
      } else {
        setShowServices(!showServices);
        if (!showServices) {
          fetchServiceLocations();
        }
      }
	} catch (error) {
	  console.error('Error al obtener las ubicaciones de los servicios:', error);
	}
  };

  const handleShowRoute = () => {
    if (routeMarkers.length === 0) {
      Alert.alert(
        'Ruta no disponible',
        'No hay datos disponibles para mostrar la ruta en este evento.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
    } else {
      setShowRoute(!showRoute);
    }
  };

  const calculateInitialRegion = (markers, lat = null, lng = null) => {
    let region = {
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
      };
    if (markers.length > 0) {
      region = {
        latitude: parseFloat(markers[markers.length - 1].latitude),
        longitude: parseFloat(markers[markers.length - 1].longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } else if (lat !== null && lng !== null) {
      region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return region;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()}`;
  };

const generateMapMarkers = () => {
  if (selectedDorsal && selectedDorsal !== allOption) {
    // Mostrar ubicaciones del dorsal seleccionado
    const dorsalLocations = userLocations.filter(location => location.dorsal === selectedDorsal);
    const latestLocation = dorsalLocations[dorsalLocations.length - 1];
    if (latestLocation) {
      const region = {
        latitude: parseFloat(latestLocation.latitude),
        longitude: parseFloat(latestLocation.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current.animateToRegion(region, 1000);

      return (
        <CustomMarker
          key={selectedDorsal}
          coordinate={{ latitude: parseFloat(latestLocation.latitude), longitude: parseFloat(latestLocation.longitude) }}
          dorsal={selectedDorsal}
          color={latestLocation.color}
          name={latestLocation.name}
          onPress={() => handleMarkerPress(selectedDorsal)}
        />
      );
    } else {
      return null;
    }
  } else {
    // Mostrar solo la última ubicación de cada dorsal
    const uniqueDorsals = [...new Set(userLocations.map(location => location.dorsal))];
    const markers = uniqueDorsals.map(dorsal => {
      const dorsalLocations = userLocations.filter(location => location.dorsal === dorsal);
      const latestLocation = dorsalLocations[dorsalLocations.length - 1];
      if (latestLocation) {
        return (
          <CustomMarker
            key={dorsal}
            coordinate={{ latitude: parseFloat(latestLocation.latitude), longitude: parseFloat(latestLocation.longitude) }}
            dorsal={dorsal}
            color={latestLocation.color}
            onPress={() => handleMarkerPress(dorsal)}
          />
        );
      } else {
        return null;
      }
    });

    // Calcula el centro del mapa en base a la última ubicación de todas las dorsales
    const latestLocations = userLocations.filter(location => uniqueDorsals.includes(location.dorsal));
    const latestOverallLocation = latestLocations[latestLocations.length - 1];
    if (latestOverallLocation) {
      const region = {
        latitude: parseFloat(latestOverallLocation.latitude),
        longitude: parseFloat(latestOverallLocation.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current.animateToRegion(region, 1000);
    }

    return markers;
  }
};




const handleMarkerPress = (dorsal) => {
  // Aquí puedes manejar la pulsación del marcador, como mostrar un estado
  // para controlar qué `Callout` se muestra en el mapa.
  setSelectedDorsal(dorsal);
};

  // Obtener las polilíneas según la selección del usuario
  const generateMapPolylines = () => {
    const mapPolylines = [];

    if (selectedDorsal && selectedDorsal !== allOption) {
      const selectedLocations = userLocations.filter(location => location.dorsal === selectedDorsal);
      const polylineCoordinates = selectedLocations.map(location => ({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
      }));

      mapPolylines.push(
        <Polyline
          key={selectedDorsal}
          coordinates={polylineCoordinates}
          strokeColor="#3388ff"
          strokeWidth={4}
        />
      );
    }
    return mapPolylines;
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case "Baño Público":
        return `https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/icono_BañoPublico.png`;
      case "Punto de Primeros Auxilios":
        return `https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/icono_PrimerosAuxilios.png`;
      case "Punto Violeta":
        return `https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/icono_PuntoVioleta.png`;
    }
  };

return (
  <View style={{ flex: 1 }}>
    {isLoading ? (
      <View style={[styles.spinnerContainer, styles.horizontal]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 0.75 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
          >
            {generateMapMarkers()}
            {generateMapPolylines()}
            {showRoute && (
              <>
                <Polyline
                  coordinates={routeMarkers.map(marker => ({
                    latitude: parseFloat(marker.latitude),
                    longitude: parseFloat(marker.longitude),
                  }))}
                  strokeColor="#ff0000"
                  strokeWidth={4}
                  lineDashPattern={[5, 10]}
                />
                {routeMarkers.map((marker, index) => {
                  // Mostrar marcador solo en la última ubicación
                  if (index === 0 || index === routeMarkers.length - 1) {
                    return (
                      <Marker
                        key={index}
                        coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
                        pinColor={index === 0 ? 'green' : 'red'}
                        onPress={() => {
                          if (index === 0) {
                            Alert.alert(
                              'Punto de partida',
                              'Este es el punto de partida del recorrido.'
                            );
                          } else if (index === routeMarkers.length - 1){
                            Alert.alert(
                              'Punto final',
                              'Este es el punto final del recorrido.'
                            );
                          }
                          else {
                            return null;
						  }
                        }}
                      />
                    );
                  } else {
                    return null;
                  }
                })}
              </>
            )}
            {/* Marcadores de los servicios */}
            {showServices && serviceLocations.map((service, index) => {
              const iconUrl = getMarkerIcon(service.type);
              return (
                <Marker
                  key={index}
                  coordinate={{ latitude: parseFloat(service.latitude), longitude: parseFloat(service.longitude) }}
                  image={{ uri: iconUrl }}
                />
              );
            })}
          </MapView>
        </View>
        <View style={{ flex: 0.20, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.title}>{eventSchedule}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <Text>Última actualización: {formattedLastMarkerTime}</Text>
          </View>
          <Picker
            selectedValue={selectedDorsal}
            style={{ height: 50, width: 150 }}
            onValueChange={(itemValue, itemIndex) => setSelectedDorsal(itemValue)}
          >
            {allDorsals.map((dorsal, index) => (
              <Picker.Item key={index} label={dorsal} value={dorsal} />
            ))}
          </Picker>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.showRouteButton, showRoute && styles.activeButton]} onPress={handleShowRoute}>
              <Text style={styles.buttonText}>{showRoute ? 'Ocultar Ruta Completa' : 'Mostrar Ruta Completa'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.showServicesButton, showServices && styles.activeButton]} onPress={handleShowServices}>
              <Text style={styles.buttonText}>{showServices ? 'Ocultar Servicios' : 'Mostrar Servicios'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center"
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10
  },
  toggleRouteButton: {
    marginTop: 10,
    color: '#3388ff',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },
  showRouteButton: {
    width: 150,
    height: 50,
    backgroundColor: '#3388ff',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  showServicesButton: {
    width: 150,
    height: 50,
    backgroundColor: '#ff0000',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activeButton: {
    opacity: 0.8,
  },
  calloutContainer: {
    width: 100,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
