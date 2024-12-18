import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface AuthButtonProps {
  onPress: () => void;
  title: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onPress, title }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
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

export default AuthButton;
