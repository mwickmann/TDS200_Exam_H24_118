import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Divider: React.FC = () => {
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text style={styles.orText}>OR</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFF',
  },
  orText: {
    marginHorizontal: 10,
    color: '#FFF',
    fontFamily: 'QuicksandRegular',
    fontSize: 16,
  },
});

export default Divider;
