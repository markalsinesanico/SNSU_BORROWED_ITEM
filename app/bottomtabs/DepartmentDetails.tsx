"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
  status: "Borrowed" | "Returned" | "Overdue";
};

const BORROWERS_STORAGE_KEY = "@borrowers_list";

export default function DepartmentDetails() {
  const params = useLocalSearchParams();
  const department = params.department as string;
  const router = useRouter();
  const [records, setRecords] = useState<BorrowRecord[]>([]);

  useEffect(() => {
    loadDepartmentRecords();
  }, [department]);

  const loadDepartmentRecords = async () => {
    try {
      const storedBorrowers = await AsyncStorage.getItem(
        BORROWERS_STORAGE_KEY
      );
      if (storedBorrowers) {
        const borrowers: BorrowRecord[] = JSON.parse(storedBorrowers);
        const filteredRecords = borrowers.filter(
          (item) => item.department === department && item.status === "Returned"
        );
        setRecords(filteredRecords);
      }
    } catch (error) {
      console.error("Error loading department records:", error);
      Alert.alert("Error", "Failed to load department records.");
    }
  };

  // Determine the background color for the header
  const getHeaderColor = () => {
    switch (department) {
      case "CEIT":
        return "#e63946"; // Red
      case "CTE":
        return "#1d3557"; // Blue
      case "CAS":
        return "#2a9d8f"; // Green
      case "COT":
        return "#e9c46a"; // Yellow
      default:
        return "#28a745"; // Default green
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{department} Department Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {records.length === 0 ? (
          <Text style={styles.emptyMessage}>
            No records found for the {department} Department.
          </Text>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <Text style={styles.studentName}>{record.studentName}</Text>
              <Text style={styles.studentId}>ID: {record.studentId}</Text>
              <Text style={styles.itemName}>Item: {record.itemName}</Text>
              <Text style={styles.courseInfo}>Course: {record.course}</Text>
              <Text style={styles.dateText}>Borrowed: {record.borrowDate}</Text>
              <Text style={styles.dateText}>Returned: {record.returnDate}</Text>
              <Text style={styles.instructorText}>
                Instructor: {record.instructor}
              </Text>
              <Text style={styles.statusText}>Status: {record.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  itemName: {
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  courseInfo: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#777",
  },
  instructorText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    color: "#28a745",
  },
});

