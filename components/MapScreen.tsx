import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Button, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import provincias from '../provincias';

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
  const mapViewRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('fetchData');
      await fetchLocationMarkers();
      await fetchRouteMarkers();
      setIsLoading(false);
    };

    fetchData();

    if(fromLiveEvents) {
      const TIME_DISTANCE = event.time_distance;
      const [time, distance] = TIME_DISTANCE.split('-').map(Number);
      if(time == 0) {
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
    // Cuando la lista de marcadores de ubicación se actualice, calcular la región inicial
    if(locationMarkers.length > 0) {
      const lastLocation = locationMarkers[locationMarkers.length - 1];
      const region = {
        latitude: parseFloat(lastLocation.latitude),
        longitude: parseFloat(lastLocation.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setInitialRegion(region);

      mapViewRef.current?.animateToRegion(region, 1000);
    }
  }, [locationMarkers]);

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

  const handleShowServices = async () => {
      try {
        const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_service_code.php?code=${event.code}`);
        console.log('response: ', response);
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
              // Mostrar marcador solo en la última ubicación
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
              strokeWidth={4}
            />
            {showRoute && ( // Mostrar la línea y marcadores de la ruta solo si showRoute es true
              <>
                <Polyline
                  coordinates={routePolylineCoordinates}
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
              const iconUrl = getMarkerIcon(service.typeID);
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
            <Text>Última actualización: {formattedLastLocationMarkerTime}</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
