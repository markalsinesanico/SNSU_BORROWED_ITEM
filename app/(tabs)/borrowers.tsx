import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateItemUnits, getItems } from '../utils/storage';

type BorrowerItem = {
  id: string;
  studentName: string;
  studentId: string;
  itemName: string;
  borrowDate: string;
  returnDate: string;
  status: 'Borrowed' | 'Returned' | 'Overdue';
  imageUrl: string;
  department: string;
  course: string;
  instructor: string;
  itemId: string;
};

const BORROWERS_STORAGE_KEY = '@borrowers_list';

export default function BorrowersScreen() {
  const router = useRouter();
  const [borrowers, setBorrowers] = useState<BorrowerItem[]>([]);
  const [itemImages, setItemImages] = useState<{[key: string]: string}>({});

  useFocusEffect(
    React.useCallback(() => {
      loadBorrowers();
      loadItemImages();
    }, [])
  );

  const loadItemImages = async () => {
    try {
      const items = await getItems();
      const images = items.reduce((acc, item) => {
        acc[item.id] = item.imageUrl;
        return acc;
      }, {} as {[key: string]: string});
      setItemImages(images);
    } catch (error) {
      console.error('Error loading item images:', error);
    }
  };

  const loadBorrowers = async () => {
    try {
      const storedBorrowers = await AsyncStorage.getItem(BORROWERS_STORAGE_KEY);
      console.log('Loaded borrowers:', storedBorrowers);
      if (storedBorrowers) {
        setBorrowers(JSON.parse(storedBorrowers));
      }
    } catch (error) {
      console.error('Error loading borrowers:', error);
    }
  };

  const getStatusColor = (status: BorrowerItem['status']) => {
    switch (status) {
      case 'Borrowed':
        return '#28a745';
      case 'Returned':
        return '#0d6efd';
      case 'Overdue':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  const handleReturn = async (borrowerId: string) => {
    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    const updatedBorrowers = borrowers.map(b => 
      b.id === borrowerId 
        ? { 
            ...b, 
            status: 'Returned' as const,
            returnDate: new Date().toISOString().split('T')[0]
          } 
        : b
    );
    
    try {
      // Increase the available units when item is returned
      const updatedItem = await updateItemUnits(borrower.itemId, 1);
      if (!updatedItem) {
        throw new Error('Failed to update item units');
      }

      // Update borrowers list
      await AsyncStorage.setItem(BORROWERS_STORAGE_KEY, JSON.stringify(updatedBorrowers));
      setBorrowers(updatedBorrowers);

      Alert.alert(
        'Success',
        'Item marked as returned and units updated.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/(tabs)/history');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating borrower status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Add this function for testing
  const clearBorrowers = async () => {
    try {
      await AsyncStorage.removeItem(BORROWERS_STORAGE_KEY);
      setBorrowers([]);
      Alert.alert('Success', 'Borrowers list cleared');
    } catch (error) {
      console.error('Error clearing borrowers:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#28a745', '#FFD700']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrowers List</Text>
        {/* Add this button for testing */}
        <TouchableOpacity onPress={clearBorrowers} style={styles.clearButton}>
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {borrowers.map((borrower) => (
          <View key={borrower.id} style={styles.borrowerCard}>
            <Image 
              source={{ 
                uri: borrower.imageUrl || itemImages[borrower.itemId] || 'https://via.placeholder.com/150'
              }} 
            />
            <View style={styles.borrowerInfo}>
              <Text style={styles.studentName}>{borrower.studentName}</Text>
              <Text style={styles.studentId}>ID: {borrower.studentId}</Text>
              <Text style={styles.itemName}>Item: {borrower.itemName}</Text>
              <Text style={styles.courseInfo}>
                {borrower.department} - {borrower.course}
              </Text>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>Borrowed: {borrower.borrowDate}</Text>
                <Text style={styles.dateText}>Return: {borrower.returnDate}</Text>
              </View>
              <Text style={styles.instructorText}>
                Instructor: {borrower.instructor}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(borrower.status) }]}>
                  <Text style={styles.statusText}>{borrower.status}</Text>
                </View>
                {borrower.status === 'Borrowed' && (
                  <TouchableOpacity 
                    style={styles.returnButton}
                    onPress={() => handleReturn(borrower.id)}
                  >
                    <Text style={styles.returnButtonText}>Mark as Returned</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
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
    marginLeft: 15,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  borrowerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  borrowerInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateContainer: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  courseInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  instructorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
    position: 'absolute',
    right: 15,
  },
}); 