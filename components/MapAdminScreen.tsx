import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, Modal, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import provincias from '../utils/provincias';
import PropTypes from 'prop-types';
import reloadIcon from '../assets/iconReload.png';
import iconEdit from '../assets/iconEdit.png';
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
  const mapViewRef = useRef(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [modalServiceVisible, setModalServiceVisible] = useState(false);
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
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedServiceType, setSelectedServiceType] = useState('1');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    await fetchLocationMarkers();
    await fetchRouteMarkers();
    setIsLoading(false);
  };

  // Este efecto se ejecuta cuando el componente se monta inicialmente.
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
  }, []);

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
    if (editingRoute) {
      setShowRoute(!showRoute);
    }
    setRouteCoordinates([]);
  }, [editingRoute]);

  useEffect(() => {
    setIsEventCancelled(event.cancelled == 1);
    return () => {
      setRouteCoordinates([]);
    };
  }, []); // Este efecto se ejecutará solo una vez, al montar el componente

  useEffect(() => {
    fetchServiceTypes();
  }, []);

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

  const fetchServiceTypes = async () => {
    try {
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/consulta_service_type.php`);
      const data = await response.json();
      setServiceTypes(data);
    } catch (error) {
      console.error('Error al obtener los tipos de servicios:', error);
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
      setLoading(true);
      const formData = new FormData();
      formData.append('id', event.id);
      formData.append('name', newEventName);
      await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/update_name_event.php?`, {
        method: 'POST',
        body: formData
      });
      setLoading(false);
      Alert.alert(
		'Nombre actualizado',
		'El nombre del evento se ha actualizado correctamente.',
		[{ text: 'OK' }]
	  );
      setNewEventName(newEventName);
	} catch (error) {
	  setLoading(false);
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
      setLoading(true);
      const formData = new FormData();
      formData.append('id', event.id);
      formData.append('startDate', newEventStartDate);
      formData.append('endDate', newEventEndDate);
      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/update_date_event.php`, {
        method: 'POST',
        body: formData
      });

      setLoading(false);

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
      setLoading(false);
      setNewEventEndDate(event.endDate);
      setNewEventStartDate(event.startDate);
      Alert.alert(
        'Error',
        'Se produjo un error al intentar actualizar las fechas. Por favor, inténtalo de nuevo más tarde.',
        [{ text: 'OK' }]
      );
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
      setLoading(true);
      for (const point of routeCoordinates) {
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
      setLoading(false);
      fetchRouteMarkers();
      setEditingRoute(false);
      if (routeCoordinates.length > 0) {
		Alert.alert(
          'Puntos insertados',
          'Los puntos se han insertado correctamente en la base de datos.',
          [{ text: 'OK' }]
        );
      }
      else {
		Alert.alert(
		  'Error',
		  'No se han insertado puntos en la base de datos. Por favor, añade al menos un punto.',
		  [{ text: 'OK' }]
		);
	  }
      setEditingRoute(true);
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Error',
        'Se produjo un error al intentar insertar los puntos en la base de datos. Por favor, inténtalo de nuevo más tarde.',
        [{ text: 'OK' }]
      );
    }
  };

  const deletePointRoute = async() => {
	try {
	  setLoading(true);
	  await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_route.php?id=${selectedRoutePoint.id}`, {
	    method: 'POST',
	  });
	  setLoading(false);
      fetchRouteMarkers();
      setModalDeleteVisible(false);
      setSelectedRoutePoint(null);
	} catch (error) {
	  setLoading(false);
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
      setShowServices(!showServices);
      if (!showServices) {
        fetchServiceLocations();
      }
    } catch (error) {
  	  console.error('Error al obtener las ubicaciones de los servicios:', error);
    }
  };

  const createService = async () => {
    try {
      setLoading(true);
      const formData = new URLSearchParams();
      formData.append('code', event.code);
      formData.append('latitude', selectedCoordinate.latitude);
      formData.append('longitude', selectedCoordinate.longitude,);
      formData.append('type', selectedServiceType);

      await fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/insertar_service.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      setLoading(false);
      setSelectedCoordinate(null);

      fetchServiceLocations();
    } catch (error) {
      setLoading(false);
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
      setLoading(true);
      await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_service.php?id=${selectedService.id}`, {
        method: 'POST',
      });
      Alert.alert(
		'Servicio eliminado',
		'El servicio se ha eliminado correctamente.',
		[{ text: 'OK' }]
	  );
	  setLoading(false);
      fetchServiceLocations();
      setModalDeleteVisible(false);
      setSelectedService(null);
	} catch (error) {
	  setLoading(false);
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
      setLoading(true);
      const formData = new FormData();
      formData.append('code', event.code);
      formData.append('action', action);
      formData.append('cancelReason', cancelReason.toString());

      const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/cancel_event.php`, {
        method: 'POST',
        body: formData
      });
      setLoading(false);
      const data = await response.text();
      if (action === 1) {
        hideCancelModalHandler();
        setIsEventCancelled(true);
      } else {
        setIsEventCancelled(false);
      }
    } catch (error) {
      setLoading(false);
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
      Alert.alert(
        'Código incorrecto',
        'El código introducido no coincide con el código del evento actual. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
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
        setShowDeleteEventModal(false);
        navigation.goBack();
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

  // Función para el modal de agregar servicio
  const renderServiceModal = () => (
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
          <Picker
            selectedValue={selectedServiceType}
            style={{ height: 50, width: 200 }}
            onValueChange={(itemValue) => setSelectedServiceType(itemValue)}
          >
            {serviceTypes.map((type, index) => (
              <Picker.Item key={index} label={type.name} value={type.id} />
            ))}
          </Picker>
          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => setModalServiceVisible(!modalServiceVisible)}
              color="red"
            />
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
  );

  // Función para el modal de detalle del servicio
  const renderServiceDetailModal = () => (
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
          <Text style={styles.modalTitle}>Detalle del Servicio</Text>
          {selectedService && (
            <>
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.detailText}>Tipo: {selectedService.type}</Text>
                <Text style={styles.detailText}>Latitud: {selectedService.latitude}</Text>
                <Text style={styles.detailText}>Longitud: {selectedService.longitude}</Text>
			  </View>
              <View style={styles.buttonContainer}>
                <Button
                  title="Cancelar"
                  onPress={() => setModalDeleteVisible(false)}
                />
                <Button
                  title="Eliminar"
                  onPress={() => {
                    deleteService();
                  }}
                  color="red"
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Función para el modal de eliminación de punto de ruta
  const renderDeleteRoutePointModal = () => (
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
            <Button
              title="Eliminar"
              onPress={() => {
                deletePointRoute();
                setModalDeleteRouteVisible(false);
              }}
              color="red"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Función para el modal de edición de nombre de evento
  const renderEditEventNameModal = () => (
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
          <Button
            title="Cancelar"
            onPress={() => {
              handleCancelEditName();
            }}
            color="red"
          />
          <Button
            title="Guardar"
            onPress={() => {
              handleSaveName();
            }}
          />
        </View>
      </View>
    </Modal>
  );

  // Función para el modal de edición de fechas de evento
  const renderEditEventDateModal = () => (
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
          <Text style={styles.labelText}>Fecha de Inicio:</Text>
          <TextInput
            style={styles.input}
            value={newEventStartDate}
            maxLength={19}
            onChangeText={(text) => setNewEventStartDate(text)}
            placeholder="Nueva Fecha de Inicio"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.labelText}>Fecha Final:</Text>
          <TextInput
            style={styles.input}
            value={newEventEndDate}
            maxLength={19}
            onChangeText={(text) => setNewEventEndDate(text)}
            placeholder="Nueva Fecha Final"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={() => {
              handleCancelEditDate();
            }}
            color="red"
          />
          <Button
            title="Guardar"
            onPress={() => {
              handleSaveDate();
            }}
          />
        </View>
      </View>
    </Modal>
  );

  // Función para el modal de inserción de código de evento
  const renderEnterCodeModal = () => (
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
            <Button title="Volver" onPress={hideEnterCodeModalHandler} />
            <Button title="Aceptar" onPress={handleEnterCodeConfirmation} />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Función para el modal de confirmación de cancelación de evento
  const renderCancelReasonModal = () => (
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
            <Button title="Volver" onPress={() => hideCancelModalHandler()} />
            <Button title="Cancelar" onPress={() => cancelEvent(1)} color="red"/>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Función para el modal de eliminación de evento
  const renderDeleteEventModal = () => (
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
              title="Volver"
              onPress={() => {
                setShowDeleteEventModal(false);
                setEnteredText('');
              }}
            />
            <Button
              title="Eliminar"
              onPress={deleteEvent}
              disabled={enteredText !== 'ELIMINAR'}
              color="red"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <View style={styles.loadingContainerMap}>
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
                  if (index === 0) {
                    return (
                      <Marker
                        key={index}
                        coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
                        pinColor={'green'}
                        onPress={() => handleRoutePress(marker)}
                      />
                    );
                  } else {
                    return (
                      <Marker
                        key={index}
                        coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
                        pinColor={'red'}
                        onPress={() => handleRoutePress(marker)}
                      />
                    );
                  }
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
	                  onPress={() => setRouteCoordinates(routeCoordinates.filter((_, i) => i !== index))}
	                />
	              );
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
                  onPress={() => handleServicePress(service)}
                >
                  {icon && <Image source={icon} style={{ width: 32, height: 32 }} />}
                </Marker>
              );
            })}
          </MapView>
          <View style={styles.container}>
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
              <TouchableOpacity onPress={() => setModalNameVisible(true)} style={styles.touchable}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>{newEventName}</Text>
                <Image source={iconEdit} style={styles.iconEdit} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalDateVisible(true)} style={styles.touchable}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>{`${formatDate(eventStartDate)} ${formatTime(eventStartDate)} - ${formatDate(eventEndDate)} ${formatTime(eventEndDate)}`}</Text>
                <Image source={iconEdit} style={styles.iconEdit} />
              </TouchableOpacity>
            </View>
            <View style={styles.containerShow}>
              <TouchableOpacity
                style={[styles.showRouteButton, loading && styles.disabledButton]}
                onPress={loading ? undefined : handleEditRoute}
                disabled={loading}
              >
                <Text style={[styles.buttonText, {color: loading ? 'gray' : '#ffffff'}]}>
                  {editingRoute ? 'Finalizar Edición' : 'Editar Ruta'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.showServicesButton, loading && styles.disabledButton]}
                onPress={loading ? undefined : handleEditServices}
                disabled={loading}
              >
                <Text style={[styles.buttonText, {color: loading ? 'gray' : '#6C21DC'}]}>
                  {showServices ? 'Finalizar Edición' : 'Editar Servicios'}
                </Text>
              </TouchableOpacity>
            </View>
			<View style={styles.containerCancelDelete}>
              <TouchableOpacity
                style={styles.cancelEventButton}
                onPress={() => isEventCancelled ? cancelEvent(0) : setShowEnterCodeModal(true)}
                >
                <Text style={styles.buttonText}>{isEventCancelled ? 'Reanudar evento' : 'Suspender evento'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteEventButton}
                onPress={showDeleteEventModalHandler}
              >
                <Text style={[styles.buttonText, {color: 'red'}]}>Eliminar Evento</Text>
              </TouchableOpacity>
            </View>
          </View>
          {editingRoute && (
            <View style={styles.insertButtonContainer}>
              <Button
                title="Insertar"
                onPress={() => {
                  insertPointRoute();
                }}
                color="#6C21DC"
                disabled={loading}
              />
            </View>
          )}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
            </View>
          )}
          {renderServiceModal()}
          {renderServiceDetailModal()}
          {renderDeleteRoutePointModal()}
          {renderEditEventNameModal()}
          {renderEditEventDateModal()}
          {renderEnterCodeModal()}
          {renderCancelReasonModal()}
          {renderDeleteEventModal()}
        </View>
      )}
    </View>
  );
}

MapScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};