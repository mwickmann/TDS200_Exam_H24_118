import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconName?: string; 
  secureTextEntry?: boolean;
  showPasswordIcon?: boolean;
  onTogglePasswordVisibility?: () => void;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  secureTextEntry = false,
  showPasswordIcon = false,
  onTogglePasswordVisibility,
  ...rest
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#ccc"
          secureTextEntry={secureTextEntry}
          {...rest}
        />
        {iconName && !showPasswordIcon && (
          <Icon
            name={iconName}
            size={24}
            color="#FFF"
            style={styles.rightIcon}
          />
        )}
        {showPasswordIcon && onTogglePasswordVisibility && (
          <Icon
            name={secureTextEntry ? "visibility-off" : "visibility"}
            size={24}
            color="#FFF"
            style={styles.rightIcon}
            onPress={onTogglePasswordVisibility}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#FFF",
    borderRadius: 10,
    marginVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: "#FFF",
    fontFamily: 'QuicksandRegular',
  },
  rightIcon: {
    padding: 10,
  },
});

export default CustomInput;
