"use client";

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

type BorrowRecord = {
  id: string;
  studentName: string;
  studentId: string;
  itemName: string;
  department: string;
  course: string;
  instructor: string;
  borrowDate: string;
  returnDate: string;
  status: 'Borrowed' | 'Returned' | 'Overdue';
};

const BORROWERS_STORAGE_KEY = '@borrowers_list';

export default function HistoryScreen() {
  const [historyByDepartment, setHistoryByDepartment] = useState<{
    [key: string]: BorrowRecord[];
  }>({});
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const storedBorrowers = await AsyncStorage.getItem(BORROWERS_STORAGE_KEY);
      console.log('Loading history, stored borrowers:', storedBorrowers);
      
      if (storedBorrowers) {
        const borrowers: BorrowRecord[] = JSON.parse(storedBorrowers);
        // Filter only returned items and organize by department
        const returnedItems = borrowers.filter(item => item.status === 'Returned');
        console.log('Returned items:', returnedItems);
        
        const grouped = returnedItems.reduce((acc, item) => {
          if (!acc[item.department]) {
            acc[item.department] = [];
          }
          acc[item.department].push(item);
          return acc;
        }, {} as { [key: string]: BorrowRecord[] });
        
        console.log('Grouped by department:', grouped);
        setHistoryByDepartment(grouped);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const debugStorage = async () => {
    try {
      const storedBorrowers = await AsyncStorage.getItem(BORROWERS_STORAGE_KEY);
      console.log('Current storage contents:', storedBorrowers);
      Alert.alert('Debug', `Storage contains ${storedBorrowers ? JSON.parse(storedBorrowers).length : 0} items`);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#28a745', '#FFD700']} style={styles.header}>
        <Text style={styles.headerTitle}>Borrowing History</Text>
        <TouchableOpacity onPress={debugStorage} style={styles.debugButton}>
          <Ionicons name="bug" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {Object.entries(historyByDepartment).map(([department, records]) => (
          <TouchableOpacity 
            key={department} 
            style={styles.section}
            // Navigate to the DepartmentDetails screen with the department as a query parameter
            onPress={() => router.push(`/bottomtabs/DepartmentDetails?department=${department}`)

          }
          >
            <Text style={styles.sectionTitle}>{department} Department</Text>
            <Text style={styles.departmentCount}>Number of Borrowers: {records.length}</Text>
          </TouchableOpacity>
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
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#28a745',
  },
  departmentCount: {
    fontSize: 16,
    color: '#333',
  },
  debugButton: {
    position: 'absolute',
    right: 15,
    padding: 8,
  },
});
