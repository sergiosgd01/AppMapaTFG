import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import provincias from '../provincias';
import PropTypes from 'prop-types';
import reloadIcon from '../assets/iconReload.png';
import iconBañoPublico from '../assets/iconBañoPublico.png';
import iconPrimerosAuxilios from '../assets/iconPrimerosAuxilios.png';
import iconPuntoVioleta from '../assets/iconPuntoVioleta.png';

// Componente personalizado para el marcador con el número de dorsal dentro de un círculo
const CustomMarker = ({ coordinate, dorsal, color, name, onPress }) => (
  <Marker coordinate={coordinate} onPress={onPress}>
    <View style={[styles.markerContainer, { backgroundColor: color }]}>
      <View style={styles.marker}>
        <Text style={styles.markerText}>{dorsal}</Text>
      </View>
    </View>
    {name && (
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
  const [isLoading, setIsLoading] = useState(false);
  const uniqueDorsals = [...new Set(userLocations.map(location => location.dorsal))];
  const allOption = 'Todos';
  const allDorsals = [allOption, ...uniqueDorsals];
  const [showRoute, setShowRoute] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const mapRef = useRef(null);
  const [showServices, setShowServices] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);

  const fetchData = async () => {
    await fetchUserLocations();
    await fetchRouteMarkers();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();

    if (fromLiveEvents) {
      const TIME_DISTANCE = event.time_distance;
      const [time, distance] = TIME_DISTANCE.split('-').map(Number);
      if (time === 0) {
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
      } else if (time < 20) {
        const interval = setInterval(fetchData, 20000);
        return () => clearInterval(interval);
      } else {
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
        return iconBañoPublico;
      case "Punto de Primeros Auxilios":
        return iconPrimerosAuxilios;
      case "Punto Violeta":
        return iconPuntoVioleta;
      default:
        return null;
    }
  };

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
          <View style={{ flex: 0.20, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
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
            {formattedLastMarkerTime && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  <Text>Última actualización: {formattedLastMarkerTime}</Text>
                 </View>
              </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Picker
                selectedValue={selectedDorsal}
                style={{ height: 50, width: 160 }}
                onValueChange={(itemValue) => setSelectedDorsal(itemValue)}
              >
                {allDorsals.map((dorsal, index) => (
                  <Picker.Item key={index} label={dorsal} value={dorsal} />
                ))}
              </Picker>
              <TouchableOpacity style={styles.commonButton} onPress={fetchData}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={reloadIcon} style={styles.imageStyle} />
                  <Text style={[styles.buttonText, {color: '#333'}]}>Actualizar Marcadores</Text>
                </View>
              </TouchableOpacity>
		    </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.showRouteButton, showRoute && styles.activeButton]} onPress={handleShowRoute}>
                <Text style={styles.buttonText}>{showRoute ? 'Ocultar Ruta Completa' : 'Mostrar Ruta Completa'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.showServicesButton, showServices && styles.activeButton]} onPress={handleShowServices}>
                <Text style={[styles.buttonText, {color: '#6C21DC'}]}>{showServices ? 'Ocultar Servicios' : 'Mostrar Servicios'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

MapMultiScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  activeButton: {
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calloutContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    padding: 10,
    width: 100,
  },
  calloutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commonButton: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    marginHorizontal: 5,
    width: 160,
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10
  },
  imageStyle: {
    height: 20,
    marginRight: 5,
    width: 20,
  },
  marker: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  markerContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
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
  spinnerContainer: {
    flex: 1,
    justifyContent: "center"
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
