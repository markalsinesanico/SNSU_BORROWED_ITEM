import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addItem } from '../utils/storage';

export default function ItemApplicationForm() {
    const router = useRouter();
    const [itemName, setItemName] = useState('');
    const [unitNumber, setUnitNumber] = useState('');
    const [image, setImage] = useState<string | null>(null);

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
            // Add the new item to the database
            await addItem({
                name: itemName,
                status: 'Available',
                imageUrl: image,
                availableUnits: parseInt(unitNumber),
            });

            Alert.alert(
                'Success', 
                'Item added successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back() // Return to previous screen after submission
                    }
                ]
            );
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Error', 'Failed to add item. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Add New Item</Text>
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
            {image && <Image source={{ uri: image }} style={styles.image} />}
            <Button title="Submit" onPress={handleSubmit} color="#28a745" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    backButton: {
        padding: 10,
    },
    title: {
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
    image: {
        width: 200,
        height: 200,
        marginBottom: 15,
        borderRadius: 8,
        alignSelf: 'center',
    },
});
