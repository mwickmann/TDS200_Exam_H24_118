import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TextInputWithIconProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconName: string;
}

const TextInputWithIcon: React.FC<TextInputWithIconProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  ...rest
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.textInputContainer}>
        <TextInput
          style={[styles.input, { paddingLeft: 35 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#ccc"
          {...rest}
        />
        <Icon name={iconName} size={24} color="#FFF" style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
    fontFamily: 'QuicksandRegular',
  },
  textInputContainer: {
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "#FFF",
    fontFamily: 'QuicksandRegular',
    borderWidth: 1,
    borderColor: "#FFF",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingLeft: 35, 
  },
  icon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});

export default TextInputWithIcon;
