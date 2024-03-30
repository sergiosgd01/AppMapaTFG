import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import provincias from '../provincias';
import PropTypes from 'prop-types';
import reloadIcon from '../assets/iconReload.png';
import iconBañoPublico from '../assets/iconBañoPublico.png';
import iconPrimerosAuxilios from '../assets/iconPrimerosAuxilios.png';
import iconPuntoVioleta from '../assets/iconPuntoVioleta.png';

export default function MapScreen({ route, navigation }) {
  const { event, fromLiveEvents } = route.params;
  const [locationMarkers, setLocationMarkers] = useState([]);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [eventSchedule, setEventSchedule] = useState('');
  const [formattedLastLocationMarkerTime, setFormattedLastLocationMarkerTime] = useState('');
  const [initialRegion, setInitialRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);
  const [improveLocation, setImproveLocation] = useState(false);
  const mapViewRef = useRef(null);

  const fetchData = async () => {
    await fetchLocationMarkers();
    await fetchRouteMarkers();
    setIsLoading(false);
  };

  // Este efecto se ejecuta cuando cambia la variable 'improveLocation' o cuando el componente se monta inicialmente.
  useEffect(() => {
      fetchData(); // Se ejecuta fetchData inmediatamente

      // Si es un evento en vivo, se establece un intervalo para actualizar periódicamente los datos.
      if (fromLiveEvents) {
        const TIME_DISTANCE = event.time_distance;
        const [time, distance] = TIME_DISTANCE.split('-').map(Number);
        if (time === 0) {
          const interval = setInterval(fetchData, 60000);
          return () => clearInterval(interval);
        } else if (time < 30) {
          const interval = setInterval(fetchData, 30000);
          return () => clearInterval(interval);
        } else {
          const interval = setInterval(fetchData, time * 1000);
          return () => clearInterval(interval);
        }
      }
    }, [improveLocation]); // Se ejecuta cuando 'improveLocation' cambia

  // Este efecto se ejecuta cuando cambia la variable 'locationMarkers'.
  useEffect(() => {
      // Esta función se ejecuta cada vez que se activa el efecto
      if (locationMarkers.length > 0) {
        const lastLocation = locationMarkers[locationMarkers.length - 1]; // Última ubicación
        const region = {
          latitude: parseFloat(lastLocation.latitude),
          longitude: parseFloat(lastLocation.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setInitialRegion(region); // Se actualiza la región inicial del mapa
        mapViewRef.current?.animateToRegion(region, 1000); // Se anima la vista del mapa a la nueva región
      }
    }, [locationMarkers]); // Se ejecuta cuando 'locationMarkers' cambia

  // Este efecto se ejecuta cuando cambia la variable 'routeMarkers'.
  useEffect(() => {
      // Esta función se ejecuta cada vez que se activa el efecto
      const correctedLocationMarkers = improveLocation ? getNearestRouteLocations(locationMarkers, routeMarkers) : locationMarkers;
      setLocationMarkers(correctedLocationMarkers); // Se actualizan los marcadores de ubicación según la opción 'improveLocation'
    }, [routeMarkers]); // Se ejecuta cuando 'routeMarkers' cambia

  const fetchLocationMarkers = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_location.php?code=${event.code}`);
      const markers = await response.json();
      setLocationMarkers(markers);
      if (markers.length > 0) {
        setFormattedLastLocationMarkerTime(markers[markers.length - 1].timestamp);
      } else {
        const province = provincias[event.province];
        if (province) {
          setInitialRegion(calculateInitialRegion([], province.lat, province.lng));
        } else {
          setInitialRegion(calculateInitialRegion([], 40.4168, -3.7038));
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

  const handleShowRoute = () => {
    if (routeMarkers.length === 0) {
      Alert.alert(
        'Ruta no disponible',
        'No hay datos disponibles para mostrar la ruta en este evento.',
        [{ text: 'OK' }]
      );
    } else {
      setShowRoute(!showRoute);
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
        [{ text: 'OK' }]
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

  const locationPolylineCoordinates = locationMarkers.map(marker => ({
    latitude: parseFloat(marker.latitude),
    longitude: parseFloat(marker.longitude),
  }));

  const routePolylineCoordinates = routeMarkers.map(marker => ({
    latitude: parseFloat(marker.latitude),
    longitude: parseFloat(marker.longitude),
  }));

  const getMarkerIcon = (type) => {
    switch (type) {
      case "Baño Público":
        return iconBañoPublico;
      case "Punto de Primeros Auxilios":
        return iconPrimerosAuxilios;
      case "Punto Violeta":
        return iconPuntoVioleta;
      default:
        return null;
    }
  };

  const findNearestRouteLocation = (location, routeCoordinates, maxDistance) => {
    let minDistance = Infinity;
    let nearestLocation = null;

    routeCoordinates.forEach(routeCoord => {
      const distance = calculateDistance(location.latitude, location.longitude, routeCoord.latitude, routeCoord.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = routeCoord;
      }
    });

    if (minDistance <= maxDistance) {
      return nearestLocation;
    } else {
      return null;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180); // Convertir a radianes
    const dLon = (lon2 - lon1) * (Math.PI / 180); // Convertir a radianes
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const getNearestRouteLocations = (locationMarkers, routeMarkers) => {
    const maxDistance = 0.2; // km
    const correctedLocations = locationMarkers.map(location => {
      const nearestRouteLocation = findNearestRouteLocation(location, routeMarkers, maxDistance);
      return nearestRouteLocation ? nearestRouteLocation : location;
    });
    return correctedLocations;
  };

  const correctedLocationMarkers = improveLocation ? getNearestRouteLocations(locationMarkers, routeMarkers) : locationMarkers;

  const showAlert = (cancelledInfo) => {
    if (cancelledInfo === null) {
      Alert.alert(
        'Motivo de cancelación',
        'Aún no se ha proporcionado ningún motivo para la cancelación. Mantente informado para conocer las actualizaciones sobre este tema. Gracias por tu paciencia y comprensión.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        'Motivo de cancelación',
        cancelledInfo,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 0.75 }}>
              <MapView
                ref={mapViewRef}
                style={{ flex: 1 }}
                initialRegion={initialRegion}
              >
                {/* Marcadores de ubicaciones */}
                {locationMarkers.map((marker, index) => {
                  if (index === locationMarkers.length - 1) {
                    return (
                      <Marker
                        key={index}
                        coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
                        pinColor={'blue'}
                      />
                    );
                  } else {
                    return null;
                  }
                })}
                <Polyline
                  coordinates={locationPolylineCoordinates}
                  strokeColor="#3388ff"
                  strokeWidth={5}
                />
                {showRoute && (
                  <>
                    <Polyline
                      coordinates={routePolylineCoordinates}
                      strokeColor="#ff0000"
                      strokeWidth={4}
                      lineDashPattern={[5, 10]}
                    />
                    {routeMarkers.map((marker, index) => {
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
                              } else if (index === routeMarkers.length - 1) {
                                Alert.alert(
                                  'Punto final',
                                  'Este es el punto final del recorrido.'
                                );
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
                  const icon = getMarkerIcon(service.type);
                  return (
                    <Marker
                      key={index}
                      coordinate={{
                        latitude: parseFloat(service.latitude),
                        longitude: parseFloat(service.longitude)
                      }}
                    >
                      {icon && <Image source={icon} style={{ width: 32, height: 32 }} />}
                    </Marker>
                  );
                })}
              </MapView>
            </View>
            <View style={styles.container}>
              {event.cancelled == 1 && (
                <View style={styles.cancelledMessage}>
                  <TouchableOpacity onPress={() => showAlert(event.cancelledInfo)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.cancelledText}>Evento cancelado</Text>
                      <Image source={require('../assets/iconInfo.png')} style={styles.infoIcon} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.title}>{eventSchedule}</Text>
              {formattedLastLocationMarkerTime && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <Text>Última actualización: {formattedLastLocationMarkerTime}</Text>
                  </View>
                </>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                <TouchableOpacity style={[styles.showRouteButton, showRoute && styles.activeButton]} onPress={handleShowRoute}>
                  <Text style={styles.buttonText}>{showRoute ? 'Ocultar Ruta Completa' : 'Mostrar Ruta Completa'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.showServicesButton, showServices && styles.activeButton]} onPress={handleShowServices}>
                  <Text style={[styles.buttonText, {color: '#6C21DC'}]}>{showServices ? 'Ocultar Servicios' : 'Mostrar Servicios'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.commonButton, styles.improveLocationButton]}
                  onPress={() => setImproveLocation(!improveLocation)}
                >
                  <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <Text style={[styles.buttonText, {color: '#333'}]}>Mejorar Ubicación</Text>
                    <Switch
                      onValueChange={() => setImproveLocation(!improveLocation)}
                      value={improveLocation}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.commonButton} onPress={fetchData}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={reloadIcon} style={styles.imageStyle} />
                    <Text style={[styles.buttonText, {color: '#333'}]}>Actualizar Marcadores</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
      )}
    </View>
  );
}

MapScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 0.20,
    marginTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  commonButton: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    marginHorizontal: 5,
    width: 160,
  },
  imageStyle: {
    height: 20,
    marginRight: 5,
    width: 20,
  },
  improveLocationButton: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    marginTop: 10,
    width: 160,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  showRouteButton: {
    alignItems: 'center',
    backgroundColor: '#6C21DC',
    borderRadius: 5,
    height: 50,
    justifyContent: 'center',
    marginRight: 10,
    width: 160,
  },
  showServicesButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#6C21DC',
    borderRadius: 5,
    borderWidth: 2,
    height: 50,
    justifyContent: 'center',
    marginLeft: 10,
    width: 160,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cancelledMessage: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
    alignItems: 'center',
    top: 0,
  },
  cancelledText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoIcon: {
    width: 22,
    height: 22,
    marginLeft: 5,
  },
});