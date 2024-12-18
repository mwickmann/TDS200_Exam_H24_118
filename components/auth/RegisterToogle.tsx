import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface RegisterToggleProps {
  isRegistering: boolean;
  toggle: () => void;
}

const RegisterToggle: React.FC<RegisterToggleProps> = ({ isRegistering, toggle }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={toggle}>
      <Text style={styles.buttonText}>
        {isRegistering ? "ALREADY HAVE AN ACCOUNT?" : "NEW? REGISTER"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#CBE8F4',
    padding: 18,
    borderRadius: 10,
    width: '98%',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
});

export default RegisterToggle;
