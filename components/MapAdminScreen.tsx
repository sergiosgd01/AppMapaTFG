import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Switch, Alert, Image, Modal, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import provincias from '../utils/provincias';
import PropTypes from 'prop-types';
import reloadIcon from '../assets/iconReload.png';
import iconBañoPublico from '../assets/iconBañoPublico.png';
import iconPrimerosAuxilios from '../assets/iconPrimerosAuxilios.png';
import iconPuntoVioleta from '../assets/iconPuntoVioleta.png';
import styles from '../styles/MapAdminScreenStyles';

export default function MapScreen({ route, navigation }) {
  const { event, fromLiveEvents } = route.params;
  const [locationMarkers, setLocationMarkers] = useState([]);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [initialRegion, setInitialRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);
  const [improveLocation, setImproveLocation] = useState(false);
  const mapViewRef = useRef(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [modalServiceVisible, setModalServiceVisible] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [editingService, setEditingService] = useState(false);
  const [editingRoute, setEditingRoute] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [selectedRoutePoint, setSelectedRoutePoint] = useState(null);
  const [modalDeleteRouteVisible, setModalDeleteRouteVisible] = useState(false);
  const [modalNameVisible, setModalNameVisible] = useState(false);
  const [newEventName, setNewEventName] = useState(event.name);
  const [modalDateVisible, setModalDateVisible] = useState(false);
  const [newEventStartDate, setNewEventStartDate] = useState(event.startDate);
  const [newEventEndDate, setNewEventEndDate] = useState(event.endDate);
  const [eventStartDate, setEventStartDate] = useState(event.startDate);
  const [eventEndDate, setEventEndDate] = useState(event.endDate);
  const [isEventCancelled, setIsEventCancelled] = useState<boolean>(false);
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showEnterCodeModal, setShowEnterCodeModal] = useState<boolean>(false);
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [enteredText, setEnteredText] = useState('');

  const fetchData = async () => {
    await fetchLocationMarkers();
    await fetchRouteMarkers();
    setIsLoading(false);
  };

  // Este efecto se ejecuta cuando cambia la variable 'improveLocation' o cuando el componente se monta inicialmente.
  useEffect(() => {
    fetchData();

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
  }, [improveLocation]);

  // Este efecto se ejecuta cuando cambia la variable 'locationMarkers'.
  useEffect(() => {
    if (locationMarkers.length > 0) {
      const lastLocation = locationMarkers[locationMarkers.length - 1];
      const region = {
        latitude: parseFloat(lastLocation.latitude),
        longitude: parseFloat(lastLocation.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setInitialRegion(region);
    }
  }, [locationMarkers]);

  useEffect(() => {
    const correctedLocationMarkers = improveLocation ? getNearestRouteLocations(locationMarkers, routeMarkers) : locationMarkers;
    setLocationMarkers(correctedLocationMarkers);
  }, [routeMarkers]);

  useEffect(() => {
    if (editingRoute) {
      handleShowRoute();
    }
    setRouteCoordinates([]);
  }, [editingRoute]);

  useEffect(() => {
    setIsEventCancelled(event.cancelled == 1);
    return () => {
      setRouteCoordinates([]);
    };
  }, []); // Este efecto se ejecutará solo una vez, al montar el componente

  const fetchLocationMarkers = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_location.php?code=${event.code}`);
      const markers = await response.json();
      setLocationMarkers(markers);
      if (markers.length == 0) {
        const province = provincias[event.province];
        if (province) {
          setInitialRegion(calculateInitialRegion([], province.lat, province.lng));
        } else {
          setInitialRegion(calculateInitialRegion([], 40.4168, -3.7038));
        }
      }
      navigation.setOptions({ title: `Edición del evento` });
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

  const handleSaveName = () => {
    setModalNameVisible(false);
    updateNameEvent();
  };

  const handleCancelEditName = () => {
    setModalNameVisible(false);
    setNewEventName(event.name);
  };

  const updateNameEvent = async() => {
    try {
      const formData = new FormData();
      formData.append('id', event.id);
      formData.append('name', newEventName);
      await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/update_name_event.php?`, {
        method: 'POST',
        body: formData
      });
      Alert.alert(
		'Nombre actualizado',
		'El nombre del evento se ha actualizado correctamente.',
		[{ text: 'OK' }]
	  );
      setNewEventName(newEventName);
	} catch (error) {
	  Alert.alert(
		'Error',
		'Se produjo un error al intentar actualizar el nombre. Por favor, inténtalo de nuevo más tarde.',
		[{ text: 'OK' }]
	  );
	}
  };

  const handleSaveDate = () => {
    setModalDateVisible(false);
    updateDateEvent();
  };

  const handleCancelEditDate = () => {
    setModalDateVisible(false);
    setNewEventStartDate(event.startDate);
    setNewEventEndDate(event.endDate);
  };

  const updateDateEvent = async () => {
    try {
      const formData = new FormData();
      formData.append('id', event.id);
      formData.append('startDate', newEventStartDate);
      formData.append('endDate', newEventEndDate);
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/update_date_event.php`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData) {

          Alert.alert(
            'Fechas actualizadas',
            'Las fechas del evento se han actualizado correctamente.',
            [{ text: 'OK' }]
          );
          setEventStartDate(newEventStartDate);
          setEventEndDate(newEventEndDate);
        } else {
          throw new Error('Error al actualizar las fechas.');
        }
      } else {
        throw new Error('Error al actualizar las fechas.');
      }
    } catch (error) {
      setNewEventEndDate(event.endDate);
      setNewEventStartDate(event.startDate);
      Alert.alert(
        'Error',
        'Se produjo un error al intentar actualizar las fechas. Por favor, inténtalo de nuevo más tarde.',
        [{ text: 'OK' }]
      );
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

  const handleEditRoute = () => {
    setShowServices(false);
    setEditingService(false);
    setShowRoute(!showRoute);
    setEditingRoute(!editingRoute);
    fetchRouteMarkers();
  };

  const handleRoutePress = (route) => {
    setSelectedRoutePoint(route);
    setModalDeleteRouteVisible(true);
  };

  const insertPointRoute = async () => {
    try {
      for (const point of routeCoordinates) {
        console.log(point);
        const formData = new URLSearchParams();
        formData.append('code', event.code);
        formData.append('latitude', point.latitude);
        formData.append('longitude', point.longitude,);
        await fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/insertar_route.php', {
	      method: 'POST',
	      headers: {
	        'Content-Type': 'application/x-www-form-urlencoded',
	      },
	      body: formData.toString(),
	    });
      }
      fetchRouteMarkers();
      Alert.alert(
        'Puntos insertados',
        'Los puntos se han insertado correctamente en la base de datos.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Se produjo un error al intentar insertar los puntos en la base de datos. Por favor, inténtalo de nuevo más tarde.',
        [{ text: 'OK' }]
      );
    }
  };

  const deletePointRoute = async() => {
	try {
	  console.log(selectedRoutePoint.id);
	  await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_route.php?id=${selectedRoutePoint.id}`, {
	    method: 'POST',
	  });
      fetchRouteMarkers();
      setModalDeleteVisible(false);
      setSelectedRoutePoint(null);
	} catch (error) {
      console.error('Error al eliminar el punto de la ruta:', error);
	  Alert.alert(
		'Error',
		'Se produjo un error al intentar eliminar el punto de la ruta. Por favor, inténtalo de nuevo más tarde.',
		[{ text: 'OK' }]
	  );
	}
  };

  const handleEditServices = () => {
    setEditingRoute(false);
    setShowServices(!showServices);
    setEditingService(!editingService);
    setModalServiceVisible(false);
    fetchServiceLocations();
  };

  const handleServicePress = (service) => {
    setSelectedService(service);
    setModalDeleteVisible(true);0
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

  const createService = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('code', event.code);
      formData.append('latitude', selectedCoordinate.latitude);
      formData.append('longitude', selectedCoordinate.longitude,);
      formData.append('type', serviceType);

      await fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/insertar_service.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      setSelectedCoordinate(null);

      fetchServiceLocations();
    } catch (error) {
      console.error('Error al crear el servicio:', error);
      Alert.alert(
        'Error',
        'Se produjo un error al intentar crear el servicio. Por favor, inténtalo de nuevo más tarde.',
        [{ text: 'OK' }]
      );
    }
  };

  const deleteService = async() => {
    try {
      await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_service.php?id=${selectedService.id}`, {
        method: 'POST',
      });
      Alert.alert(
		'Servicio eliminado',
		'El servicio se ha eliminado correctamente.',
		[{ text: 'OK' }]
	  );
      fetchServiceLocations();
      setModalDeleteVisible(false);
      setSelectedService(null);
	} catch (error) {
      console.error('Error al eliminar el servicio:', error);
	  Alert.alert(
		'Error',
		'Se produjo un error al intentar eliminar el servicio. Por favor, inténtalo de nuevo más tarde.',
		[{ text: 'OK' }]
	  );
	}
  };

  const cancelEvent = async (action: number) => {
    try {
      const formData = new FormData();
      formData.append('code', event.code);
      formData.append('action', action);
      if(action == 1) {
        formData.append('cancelReason', cancelReason.toString());
      }
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/cancel_event.php`, {
        method: 'POST',
        body: formData
      });
      const data = await response.text();
      if (action === 1) {
        hideCancelModalHandler();
        setIsEventCancelled(true);
      } else {
        setIsEventCancelled(false);
      }
    } catch (error) {
      console.error('Error al cancelar el evento:', error);
    }
  };

  const hideCancelModalHandler = () => {
    setShowCancelReasonModal(false);
    setCancelReason('');
  };

  const handleCancelReasonConfirm = () => {
    hideCancelModalHandler();
    setIsEventCancelled(true);
  };

  const showEnterCodeModalHandler = () => {
    setShowEnterCodeModal(true);
  };

  const hideEnterCodeModalHandler = () => {
    setShowEnterCodeModal(false);
    setEnteredCode('');
  };

  const handleEnterCodeConfirmation = () => {
    if (enteredCode === event.code) {
      hideEnterCodeModalHandler();
      setShowCancelReasonModal(true);
    } else {
      alert("El código introducido no coincide con el código del evento actual. Por favor, inténtalo de nuevo.");
    }
  };

  const showDeleteEventModalHandler = () => {
    setShowDeleteEventModal(true);
  };

  const deleteEvent = async () => {
    try {
      const formData = new FormData();
      formData.append('id', event.id);

      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_event.php`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Cierra el modal de eliminación del evento
        setShowDeleteEventModal(false);
        // Sal de la pantalla actual
        navigation.goBack(); // Esto te llevará a la pantalla anterior
      } else {
        console.error('Error al eliminar el evento:', data.error);
      }
    } catch (error) {
      console.error('Error al eliminar el evento:', error);
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
      {/* Renderizado condicional de la vista de carga */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapViewRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            onPress={(event) => {
              if (editingRoute) {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setRouteCoordinates([...routeCoordinates, { latitude, longitude }]);
              }
              if (editingService) {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setSelectedCoordinate({ latitude, longitude });
                setModalServiceVisible(true);
              }
            }}
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
            {selectedCoordinate && (
              <Marker
                coordinate={selectedCoordinate}
                pinColor={'red'}
              />
            )}
            {/* Marcadores de ruta */}
            {editingRoute && (
              <>
                <Polyline
                  coordinates={routePolylineCoordinates}
                  strokeColor="#ff0000"
                  strokeWidth={4}
                  lineDashPattern={[5, 10]}
                />
                {routeMarkers.map((marker, index) => {
                  return (
                    <Marker
                      key={index}
                      coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
                      pinColor={'red'}
                      onPress={() => handleRoutePress(marker)}
                    />
				  );
                })}
              </>
            )}
            {editingRoute && (
	          <>
	            <Polyline
	              coordinates={routeCoordinates}
	              strokeColor="#ff0000"
	              strokeWidth={4}
	              lineDashPattern={[5, 10]}
	            />
	            {routeCoordinates.map((marker, index) => {
	              return (
	                <Marker
	                  key={index}
	                  coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
	                  pinColor={'red'}
	                />
	              );
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
                  onPress={() => handleServicePress(service)}
                >
                  {icon && <Image source={icon} style={{ width: 32, height: 32 }} />}
                </Marker>
              );
            })}
          </MapView>
          {/* Contenedor de botones */}
          <View style={styles.container}>
            {/* Mensaje de evento cancelado */}
            {isEventCancelled && (
              <View style={styles.cancelledMessage}>
                <TouchableOpacity onPress={() => showAlert(event.cancelledInfo)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.cancelledText}>Evento cancelado</Text>
                    <Image source={require('../assets/iconInfo.png')} style={styles.infoIcon} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setModalNameVisible(true)}>
                <Text style={styles.title}>{newEventName}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalDateVisible(true)}>
                <Text style={styles.title}>{`${formatDate(eventStartDate)} ${formatTime(eventStartDate)} - ${formatDate(eventEndDate)} ${formatTime(eventEndDate)}`}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.containerShow}>
              {/* Botón de editar ruta */}
              <TouchableOpacity style={[styles.showRouteButton, editingRoute && styles.activeButton]} onPress={handleEditRoute}>
                <Text style={styles.buttonText}>{editingRoute ? 'Terminar Edición de Ruta' : 'Editar Ruta'}</Text>
              </TouchableOpacity>
              {/* Botón de editar servicios */}
              <TouchableOpacity style={[styles.showServicesButton, showServices && styles.activeButton]} onPress={handleEditServices}>
                <Text style={[styles.buttonText, {color: '#6C21DC'}]}>{showServices ? 'Dejar de Editar Servicios' : 'Editar Servicios'}</Text>
              </TouchableOpacity>
            </View>
			<View style={styles.containerCancelDelete}>
              <TouchableOpacity
                style={styles.showRouteButton}
                onPress={() => isEventCancelled ? cancelEvent(0) : setShowEnterCodeModal(true)}
                >
                <Text style={styles.buttonText}>{isEventCancelled ? 'Reanudar evento' : 'Suspender evento'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.showServicesButton, showServices && styles.activeButton]}
                onPress={showDeleteEventModalHandler}
              >
                <Text style={[styles.buttonText, {color: 'red'}]}>Eliminar Evento</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Botón "Insertar" para insertar puntos */}
          {editingRoute && (
            <View style={styles.insertButtonContainer}>
              <Button
                title="Insertar"
                onPress={() => {
                  insertPointRoute();
                }}
              />
            </View>
          )}
          {/* Modal para agregar servicio */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalServiceVisible}
            onRequestClose={() => {
              setModalServiceVisible(!modalServiceVisible);
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Agregar nuevo servicio</Text>
                {/* Selector de tipo de servicio */}
                <Picker
                  selectedValue={serviceType}
                  style={{ height: 50, width: 200 }}
                  onValueChange={(itemValue) => setServiceType(itemValue)}
                >
                  <Picker.Item label="Punto de Primeros Auxilios" value="Punto de Primeros Auxilios" />
                  <Picker.Item label="Punto Violeta" value="Punto Violeta" />
                  <Picker.Item label="Baño Público" value="Baño Público" />
                </Picker>
                {/* Botones para cancelar y agregar servicio */}
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancelar"
                    onPress={() => setModalServiceVisible(!modalServiceVisible)}
                  />
                  <View style={{ width: 20 }} />
                  <Button
                    title="Agregar"
                    onPress={() => {
                      createService();
                      setModalServiceVisible(!modalServiceVisible);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalDeleteVisible}
            onRequestClose={() => {
              setModalDeleteVisible(!modalDeleteVisible);
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Detalle del Servicio</Text>
                {selectedService && (
                  <>
                    <Text>Tipo: {selectedService.type}</Text>
                    <Text>Latitud: {selectedService.latitude}</Text>
                    <Text>Longitud: {selectedService.longitude}</Text>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="Cancelar"
                        onPress={() => setModalDeleteVisible(false)}
                      />
                      <View style={{ width: 20 }} />
                      <Button
                        title="Eliminar"
                        onPress={() => {
                          deleteService();
                        }}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalDeleteRouteVisible && editingRoute && !!selectedRoutePoint}
            onRequestClose={() => {
              setModalDeleteRouteVisible(false);
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Eliminar Punto de Ruta</Text>
                <Text>¿Estás seguro de que deseas eliminar este punto de la ruta?</Text>
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setModalDeleteRouteVisible(false);
                      setSelectedRoutePoint(null);
                    }}
                  />
                  <View style={{ width: 20 }} />
                  <Button
                    title="Eliminar"
                    onPress={() => {
                      deletePointRoute();
                      setModalDeleteRouteVisible(false);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalNameVisible}
            onRequestClose={() => {
              setModalNameVisible(!modalNameVisible);
            }}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Editar Nombre del Evento</Text>
              <TextInput
                style={styles.input}
                value={newEventName}
                onChangeText={(text) => setNewEventName(text)}
                maxLength={60}
                placeholder="Nuevo Nombre"
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCancelEditName}>
                  <Text style={styles.modalButton}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveName}>
                  <Text style={styles.modalButton}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalDateVisible}
            onRequestClose={() => {
              setModalDateVisible(!modalDateVisible);
            }}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Editar Fechas del Evento</Text>
              <View style={styles.inputContainer}>
                <Text>Fecha de Inicio:</Text>
                <TextInput
                  style={styles.input}
                  value={newEventStartDate}
                  maxLength={19}
                  onChangeText={(text) => setNewEventStartDate(text)}
                  placeholder="Nueva Fecha de Inicio"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text>Fecha Final:</Text>
                <TextInput
                  style={styles.input}
                  value={newEventEndDate}
                  maxLength={19}
                  onChangeText={(text) => setNewEventEndDate(text)}
                  placeholder="Nueva Fecha Final"
                />
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCancelEditDate}>
                  <Text style={styles.modalButton}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveDate}>
                  <Text style={styles.modalButton}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
		  <Modal
	        animationType="slide"
	        transparent={true}
	        visible={showEnterCodeModal}
	        onRequestClose={hideEnterCodeModalHandler}
	      >
	        <View style={[styles.modalContainer, { paddingHorizontal: 20 }]}>
	          <View style={styles.modalContent}>
	            <Text style={styles.textModal}>Por seguridad, se debe introducir el código del evento para poder suspenderlo.</Text>
	            <TextInput
	              style={styles.input}
	              onChangeText={setEnteredCode}
	              value={enteredCode}
	              keyboardType="numeric"
	              placeholder="Código del evento"
	            />
	            <View style={styles.modalButtons}>
	              <Button title="Aceptar" onPress={handleEnterCodeConfirmation} />
	              <Button title="Cancelar" onPress={hideEnterCodeModalHandler} />
	            </View>
	          </View>
	        </View>
	      </Modal>
          <Modal
            animationType="slide-up"
            transparent={true}
            visible={showCancelReasonModal}
            onRequestClose={() => hideCancelModalHandler()}
          >
            <View style={[styles.modalContainer, { paddingHorizontal: 20 }]}>
              <View style={styles.modalContent}>
                <Text style={styles.textModal}>Por favor, ingrese el motivo de cancelación (máximo 200 caracteres):</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setCancelReason}
                  value={cancelReason}
                  placeholder="Motivo de cancelación"
                  maxLength={200}
                />
                <View style={styles.modalButtons}>
                  <Button title="CANCELAR" onPress={() => cancelEvent(1)} color="red"/>
                  <Button title="Volver" onPress={() => hideCancelModalHandler()} />
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={showDeleteEventModal}
            onRequestClose={() => setShowDeleteEventModal(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Para eliminar el evento, escriba "ELIMINAR" y presione Eliminar:</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setEnteredText}
                  value={enteredText}
                  placeholder="Escriba 'ELIMINAR' aquí"
                />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowDeleteEventModal(false)}
                  />
                  <View style={{ width: 20 }} />
                  <Button
                    title="Eliminar"
                    onPress={deleteEvent}
                    disabled={enteredText !== 'ELIMINAR'}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

MapScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};