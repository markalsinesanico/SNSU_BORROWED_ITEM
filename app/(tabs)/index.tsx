import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { addItem, updateItem, getItems, updateItemUnits, deleteItem } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

type Item = {
  id: string;
  name: string;
  status: string;
  imageUrl: string;
  availableUnits: number;
};

export default function AvailableItemsScreen() {
  const router = useRouter();
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    try {
      const items = await getItems();
      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setUnitNumber(item.availableUnits.toString());
    setImage(item.imageUrl);
    setIsEditModalVisible(true);
  };

  const handleBorrow = (item: Item) => {
    if (item.availableUnits <= 0) {
      Alert.alert('Error', 'No units available for borrowing');
      return;
    }

    updateItemUnits(item.id, -1).then((updatedItem) => {
      if (updatedItem) {
        setAvailableItems(prevItems =>
          prevItems.map(prevItem =>
            prevItem.id === item.id ? updatedItem : prevItem
          )
        );

        router.push({
          pathname: '/bottomtabs/form',
          params: {
            itemId: item.id,
            itemName: item.name,
            availableUnits: updatedItem.availableUnits
          }
        });
      }
    });
  };

  const handleDelete = (item: Item) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${item.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteItem(item.id);
              if (success) {
                setAvailableItems(prevItems => 
                  prevItems.filter(prevItem => prevItem.id !== item.id)
                );
                Alert.alert("Success", "Item deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete item");
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert("Error", "Failed to delete item");
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!itemName || !unitNumber || !image) {
      Alert.alert('Error', 'Please fill all fields and upload an image.');
      return;
    }

    try {
      const newItem = await addItem({
        name: itemName,
        status: 'Available',
        imageUrl: image,
        availableUnits: parseInt(unitNumber),
      });

      if (newItem) {
        setAvailableItems(prevItems => [...prevItems, newItem]);

        Alert.alert(
          'Success', 
          'Item added successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsModalVisible(false);
                setItemName('');
                setUnitNumber('');
                setImage(null);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleEditSubmit = async () => {
    if (!editingItem || !itemName || !unitNumber || !image) {
      Alert.alert('Error', 'Please fill all fields and upload an image.');
      return;
    }

    try {
      const updatedItem = await updateItem(editingItem.id, {
        name: itemName,
        imageUrl: image,
        availableUnits: parseInt(unitNumber),
      });

      if (updatedItem) {
        setAvailableItems(prevItems => 
          prevItems.map(item => 
            item.id === editingItem.id ? updatedItem : item
          )
        );

        Alert.alert(
          'Success', 
          'Item updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsEditModalVisible(false);
                setEditingItem(null);
                setItemName('');
                setUnitNumber('');
                setImage(null);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const EditModal = () => (
    <Modal
      visible={isEditModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setIsEditModalVisible(false);
                setEditingItem(null);
                setItemName('');
                setUnitNumber('');
                setImage(null);
              }} 
              style={styles.backButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Item</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Name of the Item"
            value={itemName}
            onChangeText={setItemName}
          />
          <TextInput
            style={styles.input}
            placeholder="Number of Units"
            keyboardType="numeric"
            value={unitNumber}
            onChangeText={setUnitNumber}
          />
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Text style={styles.imageText}>Change Image</Text>
          </TouchableOpacity>
          {image && <Image source={{ uri: image }} style={styles.uploadedImage} />}
          <Button title="Save Changes" onPress={handleEditSubmit} color="#0d6efd" />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Header with Menu Icon */}
      <LinearGradient colors={['#28a745', '#FFD700']} style={styles.header}>
        <Text style={styles.headerTitle}>SNSU Borrowed Item</Text>
       
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {/* Title & Add Button */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Items</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setIsModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* List of Available Items */}
          {availableItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemStatus}>{item.status}</Text>
                <Text style={styles.availableUnits}>{item.availableUnits} units available</Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => handleEdit(item)}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.borrowButton]} onPress={() => handleBorrow(item)}>
                  <Text style={styles.buttonText}>Request Borrow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)} 
                style={styles.backButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Item</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name of the Item"
              value={itemName}
              onChangeText={setItemName}
            />
            <TextInput
              style={styles.input}
              placeholder="Number of Units"
              keyboardType="numeric"
              value={unitNumber}
              onChangeText={setUnitNumber}
            />
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.imageText}>Upload Image</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.uploadedImage} />}
            <Button title="Submit" onPress={handleSubmit} color="#28a745" />
          </View>
        </View>
      </Modal>

      <EditModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
    marginLeft: 40,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemStatus: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  availableUnits: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 120,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#0d6efd',
  },
  borrowButton: {
    backgroundColor: '#28a745',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 15,
    fontSize: 16,
  },
  imagePicker: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ddd',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  imageText: {
    color: '#333',
    fontSize: 16,
  },
  uploadedImage: {
    width: 200,
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButton: {
    padding: 8,
  },
});
