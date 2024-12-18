// components/MapComponent.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '80%',
  height: 300, 
};

const MapComponent = ({ location, filteredExhibitions, googleApiKey }) => {
  return (
    <View style={styles.mapContainer}>
      <LoadScript googleMapsApiKey={googleApiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{
            lat: location.latitude,
            lng: location.longitude,
          }}
          zoom={10}
          provider="google" 
        >
          <Marker
            position={{
              lat: location.latitude,
              lng: location.longitude,
            }}
            title="Din Lokasjon"
          />
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
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: 300,
    marginBottom: 10,
  },
});

export default MapComponent;
