import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import provincias from '../utils/provincias';
import PropTypes from 'prop-types';
import reloadIcon from '../assets/iconReload.png';
import styles from '../styles/MapMultiScreenStyles';

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
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isEventCancelled, setIsEventCancelled] = useState<boolean>(false);
  const [isEventFinished, setIsEventFinished] = useState<boolean>(false);

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
    obtenerDatosEvento(event.code);
    if (userLocations.length > 0) {
      if (selectedDorsal === allOption) {
        // Muestra la última ubicación recibida de todos los dorsales
        const lastLocation = userLocations[userLocations.length - 1];
        mapRef.current.animateToRegion({
          latitude: parseFloat(lastLocation.latitude),
          longitude: parseFloat(lastLocation.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      } else {
        // Muestra la ubicación del dorsal seleccionado
        const selectedLocations = userLocations.filter(location => location.dorsal === selectedDorsal);
        const lastLocation = selectedLocations[selectedLocations.length - 1];
        if (lastLocation) {
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

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const obtenerDatosEvento = async (code: string) => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_events_code.php?code=${code}`);
      const data = await response.json();

      if (data.length > 0) {
        const jsonObject = data[0];
        setIsEventCancelled(jsonObject.status == 1);
        setIsEventFinished(jsonObject.status == 2);
      } else {
        console.error('No se encontraron eventos para el código proporcionado.');
      }
    } catch (error) {
      console.error('Error al obtener datos de evento:', error);
    }
  };

  const fetchUserLocations = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_location.php?code=${event.code}`);
      const markers = await response.json();
      setUserLocations(markers);
      if (markers.length > 0) {
        setFormattedLastMarkerTime(markers[markers.length - 1].timestamp);
        if (!initialRegion) {
          setInitialRegion(calculateInitialRegion(markers));
        }
      } else {
        const province = provincias[event.province];
        if (province) {
          if (!initialRegion) {
            setInitialRegion(calculateInitialRegion([], province.lat, province.lng));
          }
        } else {
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

  const fetchServiceTypes = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_service_type.php`);
      const data = await response.json();
      setServiceTypes(data);
    } catch (error) {
      console.error('Error al obtener los tipos de servicios:', error);
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
      // Muestra ubicaciones del dorsal seleccionado
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
      // Muestra solo la última ubicación de cada dorsal
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

      // Calcula el centro del mapa con la última ubicación de todas las dorsales
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

  const getMarkerIcon = (service, serviceTypes) => {
    const serviceType = serviceTypes.find(type => type.id === service.type);
    if (serviceType && serviceType.image) {
      return { uri: serviceType.image };
    } else {
      return null;
    }
  };

  const showAlert = (cancelledInfo) => {
    if (cancelledInfo == '' || cancelledInfo == null) {
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
                  // Muestra marcador solo de la última ubicación
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
              const icon = getMarkerIcon(service, serviceTypes);
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
          <View style={styles.container}>
            {isEventCancelled && !isEventFinished && (
              <View style={styles.cancelledMessage}>
                <TouchableOpacity onPress={() => showAlert(event.cancelledInfo)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.cancelledText}>Evento cancelado</Text>
                    <Image source={require('../assets/iconInfo.png')} style={styles.infoIcon} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
            {isEventFinished && (
              <View style={styles.cancelledMessage}>
                <TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.cancelledText}>Evento finalizado</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.header}>
              <Text style={styles.title}>{eventSchedule}</Text>
              {formattedLastMarkerTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  <Text>Última actualización: {formattedLastMarkerTime}</Text>
                </View>
              )}
            </View>
            <View style={styles.containerShow}>
       	      <TouchableOpacity style={[styles.showRouteButton, showRoute && styles.activeButton]} onPress={handleShowRoute}>
                <Text style={styles.buttonText}>{showRoute ? 'Ocultar Ruta Completa' : 'Mostrar Ruta Completa'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.showServicesButton, showServices && styles.activeButton]} onPress={handleShowServices}>
                <Text style={[styles.buttonText, {color: '#6C21DC'}]}>{showServices ? 'Ocultar Servicios' : 'Mostrar Servicios'}</Text>
              </TouchableOpacity>
	        </View>
	        <View style={styles.containerPickerUpdate}>
              <Picker
                selectedValue={selectedDorsal}
                style={styles.commonButton}
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