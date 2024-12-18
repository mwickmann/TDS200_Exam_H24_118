import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingErrorProps {
    loading: boolean;
    error?: string | null;
  }
  
const LoadingError: React.FC<LoadingErrorProps> = ({ loading, error }) => {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#CBE8F4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default LoadingError;
