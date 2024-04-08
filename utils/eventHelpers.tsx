import { Alert } from 'react-native';

export const updateNameEvent = async (event, newEventName) => {
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
    return newEventName;
  } catch (error) {
    Alert.alert(
      'Error',
      'Se produjo un error al intentar actualizar el nombre. Por favor, inténtalo de nuevo más tarde.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const updateDateEvent = async (event, newEventStartDate, newEventEndDate) => {
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
        return { newEventStartDate, newEventEndDate };
      } else {
        throw new Error('Error al actualizar las fechas.');
      }
    } else {
      throw new Error('Error al actualizar las fechas.');
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'Se produjo un error al intentar actualizar las fechas. Por favor, inténtalo de nuevo más tarde.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const insertPointRoute = async (routeCoordinates, event) => {
  try {
    for (const point of routeCoordinates) {
      const formData = new URLSearchParams();
      formData.append('code', event.code);
      formData.append('latitude', point.latitude);
      formData.append('longitude', point.longitude);
      await fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/insertar_route.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
    }
    if (routeCoordinates.length > 0) {
      Alert.alert(
        'Puntos insertados',
        'Los puntos se han insertado correctamente en la base de datos.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Error',
        'No se han insertado puntos en la base de datos. Por favor, añade al menos un punto.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'Se produjo un error al intentar insertar los puntos en la base de datos. Por favor, inténtalo de nuevo más tarde.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const deletePointRoute = async (selectedRoutePoint) => {
  try {
    console.log('eliminado punto de ruta:', selectedRoutePoint);
    await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_route.php?id=${selectedRoutePoint.id}`, {
      method: 'POST',
    });
    Alert.alert(
      'Punto eliminado',
      'El punto de ruta se ha eliminado correctamente.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Error al eliminar el punto de la ruta:', error);
    Alert.alert(
      'Error',
      'Se produjo un error al intentar eliminar el punto de la ruta. Por favor, inténtalo de nuevo más tarde.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const createService = async (event, selectedCoordinate, selectedServiceType) => {
  try {
    console.log('selectedServiceType', selectedServiceType);
    const formData = new URLSearchParams();
    formData.append('code', event.code);
    formData.append('latitude', selectedCoordinate.latitude);
    formData.append('longitude', selectedCoordinate.longitude);
    formData.append('type', selectedServiceType);

    await fetch('https://pruebaproyectouex.000webhostapp.com/proyectoTFG/insertar_service.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    Alert.alert(
      'Servicio creado',
      'El servicio se ha creado correctamente.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Error al crear el servicio:', error);
    Alert.alert(
      'Error',
      'Se produjo un error al intentar crear el servicio. Por favor, inténtalo de nuevo más tarde.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const deleteService = async (selectedService) => {
  try {
    await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/delete_service.php?id=${selectedService.id}`, {
      method: 'POST',
    });
    Alert.alert(
      'Servicio eliminado',
      'El servicio se ha eliminado correctamente.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Error al eliminar el servicio:', error);
    Alert.alert(
      'Error',
      'Se produjo un error al intentar eliminar el servicio. Por favor, inténtalo de nuevo más tarde.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const cancelEvent = async (event, action, cancelReason = '') => {
  try {
    const formData = new FormData();
    formData.append('code', event.code);
    formData.append('action', action);
    if (action === 1) {
      formData.append('cancelReason', cancelReason.toString());
    }
    const response = await fetch(`https://pruebaproyectouex.000webhostapp.com/proyectoTFG/cancel_event.php`, {
      method: 'POST',
      body: formData
    });
    const data = await response.text();
    if (action === 1) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al cancelar el evento:', error);
    throw error;
  }
};

export const calculateInitialRegion = (markers, lat = null, lng = null) => {
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
