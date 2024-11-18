import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '@/app/(tabs)/HomeScreen';
import ArtPostForm from '@/app/(tabs)/UploadScreen';
import DiscoverScreen from '@/app/(tabs)/DiscoverScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          // Velg ikon basert på rutenavn
          switch (route.name) {
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Upload':
              iconName = 'cloud-upload-outline';
              break;
            case 'Discover':
              iconName = 'search-outline';
              break;
            case 'Profile':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
              break;
          }

          // Returner ikonet
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, 
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Upload"
        component={ArtPostForm}
        options={{
          tabBarLabel: "Upload",
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "Discover",
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}
