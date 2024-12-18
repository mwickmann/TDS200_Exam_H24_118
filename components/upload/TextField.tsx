// TextField Component
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({ label, value, onChangeText, multiline = false }) => {
  return (
    <View style={styles.textFieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.textfield, multiline && { height: 84 }]}
        placeholderTextColor="#888"
        multiline={multiline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  textFieldContainer: {
    paddingTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    marginTop: 10,
  },
  textfield: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: '#444',
    backgroundColor: '#333',
    color: '#ffffff',
  },
});

export default TextField;
