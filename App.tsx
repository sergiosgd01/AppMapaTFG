import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import LiveEventsScreen from './components/LiveEventsScreen';
import UpcomingEventsScreen from './components/UpcomingEventsScreen';
import PastEventsScreen from './components/PastEventsScreen';
import MapMultiScreen from './components/MapMultiScreen';
import MapScreen from './components/MapScreen';

import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Image source']);
LogBox.ignoreLogs(['Bottom Tab Navigator']);
//LogBox.ignoreAllLogs();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function EventsTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Eventos en Directo"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Eventos Pasados') {
            iconName = focused ? 'https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/iconPastEventFocus.png' : 'https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/iconPastEvents.png';
          } else if (route.name === 'Eventos en Directo') {
            iconName = focused ? 'https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/iconLiveEventFocus.png' : 'https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/iconLiveEvents.png';
          } else if (route.name === 'Eventos Futuros') {
            iconName = focused ? 'https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/iconUpcomingEventFocus.png' : 'https://pruebaproyectouex.000webhostapp.com/proyectoTFG/imagenes/iconUpcomingEvents.png';
          }

          return <Image source={{ uri: iconName }} style={{ width: size, height: size }} />;
        },
      })}
      tabBarOptions={{
        style: {
          height: 80,
        },
        iconStyle: {
          height: 40,
          width: 40,
        },
        labelStyle: {
          marginBottom: 4,
          fontSize: 11,
          fontWeight: 'bold',
        }
      }}
    >
      <Tab.Screen name="Eventos Pasados" component={PastEventsScreen} />
      <Tab.Screen name="Eventos en Directo" component={LiveEventsScreen} />
      <Tab.Screen name="Eventos Futuros" component={UpcomingEventsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
			<Stack.Screen
	            name="Map"
	            component={MapScreen}
	            initialParams={{ eventName: 'Evento' }}
	            options={({ route }) => ({ title: route.params.eventName })}
            />
	        <Stack.Screen
	            name="MapMulti"
	            component={MapMultiScreen}
	            initialParams={{ event: 'Evento' }}
	            options={({ route }) => ({ title: route.params.event.name })}
            />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registro" component={RegisterScreen} />
            <Stack.Screen name="Events" component={EventsTabNavigator} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}