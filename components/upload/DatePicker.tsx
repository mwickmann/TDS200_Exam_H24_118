// DatePicker Component
import React from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Pressable, Text, StyleSheet } from 'react-native';

interface DatePickerProps {
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  exhibitionDate: Date | null;
  setExhibitionDate: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ showDatePicker, setShowDatePicker, exhibitionDate, setExhibitionDate }) => {
  return (
    <>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={[styles.textfield, { justifyContent: 'center' }]}
      >
        <Text style={{ color: '#888' }}>{exhibitionDate ? exhibitionDate.toDateString() : 'Choose date'}</Text>
      </Pressable>
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setExhibitionDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
        textColor="#007AFF"
      />
    </>
  );
};

const styles = StyleSheet.create({
  textfield: {
    borderWidth: 1,
    padding: 10,
    marginTop: 2,
    borderRadius: 5,
    borderColor: '#444',
    backgroundColor: '#333',
    color: '#ffffff',
  },
});

export default DatePicker;
