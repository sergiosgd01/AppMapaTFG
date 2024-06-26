import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Image, View, Text, TouchableOpacity } from 'react-native';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import LiveEventsScreen from './components/LiveEventsScreen';
import UpcomingEventsScreen from './components/UpcomingEventsScreen';
import PastEventsScreen from './components/PastEventsScreen';
import MapMultiScreen from './components/MapMultiScreen';
import MapScreen from './components/MapScreen';
import MapAdminScreen from './components/MapAdminScreen';
import MapMultiAdminScreen from './components/MapMultiAdminScreen';
import PropTypes from 'prop-types';

import pastEventsIcon from './assets/iconPastEvents.png';
import liveEventsIcon from './assets/iconLiveEvents.png';
import upcomingEventsIcon from './assets/iconUpcomingEvents.png';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const icons = {
          'Eventos Pasados': pastEventsIcon,
          'Eventos en Directo': liveEventsIcon,
          'Eventos Futuros': upcomingEventsIcon
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Image
              source={icons[label]}
              style={{ width: 25, height: 25, marginBottom: 3, marginTop: 4, tintColor: isFocused ? '#6C21DC' : '#222' }}
            />
            <Text style={{ color: isFocused ? '#6C21DC' : '#222', marginBottom: 3, fontSize: 11, fontWeight: 'bold' }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EventsTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Eventos en Directo"
      tabBar={props => <MyTabBar {...props} />}
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
	      <Stack.Screen
            name="MapAdmin"
            component={MapAdminScreen}
            initialParams={{ eventName: 'Evento' }}
            options={({ route }) => ({ title: route.params.eventName })}
          />
	      <Stack.Screen
            name="MapMultiAdmin"
            component={MapMultiAdminScreen}
            initialParams={{ eventName: 'Evento' }}
            options={({ route }) => ({ title: route.params.eventName })}
          />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Registro" component={RegisterScreen} />
          <Stack.Screen name="Events" component={EventsTabNavigator} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

MyTabBar.propTypes = {
  state: PropTypes.object.isRequired,
  descriptors: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired
};
