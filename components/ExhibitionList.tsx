import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ExhibitionListProps = {
  filteredExhibitions: any[];
  onExhibitionPress: (exhibition: any) => void;
};

const ExhibitionList: React.FC<ExhibitionListProps> = ({ filteredExhibitions, onExhibitionPress }) => {
  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.listItem} onPress={() => onExhibitionPress(item)}>
      <Text style={styles.listItemTitle}>{item.exhibitionName || "Unknown"}</Text>
      <View style={styles.listItemRow}>
        <Ionicons name="location-outline" size={16} color="#888" style={styles.listItemIcon} />
        <Text style={styles.listItemText}>{item.city || "Ukjent by"}</Text>
      </View>
      <View style={styles.listItemRow}>
        <Ionicons name="person-outline" size={16} color="#888" style={styles.listItemIcon} />
        <Text style={styles.listItemText}>Artist: {item.artist}</Text>
      </View>
      <View style={styles.listItemRow}>
        <Ionicons name="calendar-outline" size={16} color="#888" style={styles.listItemIcon} />
        <Text style={styles.listItemText}>Date: {item.date}</Text>
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={filteredExhibitions}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={() => (
        <Text style={styles.noExhibitionsText}>No exhibitions found..</Text>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listItem: {
    padding: 15,
    backgroundColor: "#2c2c2c",
    marginBottom: 10,
    borderRadius: 10,
  },
  listItemTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#ffffff",
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  listItemIcon: {
    marginRight: 5,
  },
  listItemText: {
    color: '#ccc',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
  noExhibitionsText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ExhibitionList;
