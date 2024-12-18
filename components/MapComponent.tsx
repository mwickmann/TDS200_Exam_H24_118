import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import MapView, { Marker as RNMarker } from 'react-native-maps';

type Exhibition = {
  id: string;
  artist: string;
  exhibitionName: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  date: string;
};

type MapComponentProps = {
  location: {
    latitude: number;
    longitude: number;
  };
  filteredExhibitions: Exhibition[];
  googleApiKey: string;
};

const containerStyle = {
  width: '100%',
  height: '80%', // Juster høyden etter behov
};

const MapComponent: React.FC<MapComponentProps> = ({ location, filteredExhibitions, googleApiKey }) => {
    // Legg til console.log her for å bekrefte at API-nøkkelen er riktig
    console.log("Google API Key:", googleApiKey);
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapContainer}>
        <LoadScript googleMapsApiKey={googleApiKey}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{
              lat: location.latitude,
              lng: location.longitude,
            }}
            zoom={12}
          >
            {/* Marker for brukerens lokasjon */}
            <Marker
              position={{
                lat: location.latitude,
                lng: location.longitude,
              }}
              title="Din Lokasjon"
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
            />

            {/* Markører for utstillinger */}
            {filteredExhibitions.map((exhibition) => (
              <Marker
                key={exhibition.id}
                position={{
                  lat: exhibition.location.latitude,
                  lng: exhibition.location.longitude,
                }}
                title={exhibition.exhibitionName}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </View>
    );
  } else {
    // For iOS and Android
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Marker for brukerens lokasjon */}
          <RNMarker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Din Lokasjon"
            description="Dette er din nåværende posisjon."
            pinColor="blue"
          />

          {/* Markører for utstillinger */}
          {filteredExhibitions.map((exhibition) => (
            <RNMarker
              key={exhibition.id}
              coordinate={{
                latitude: exhibition.location.latitude,
                longitude: exhibition.location.longitude,
              }}
              title={exhibition.exhibitionName}
              description={exhibition.description}
            />
          ))}
        </MapView>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: 300, // Juster høyden etter behov
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapComponent;
