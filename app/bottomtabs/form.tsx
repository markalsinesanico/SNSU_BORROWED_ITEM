import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateItemUnits, getItems } from '../utils/storage';

interface FormData {
  name: string;
  idNumber: string;
  year: string;
  department: string;
  course: string;
  timeIn: string;
  timeOut: string;
  instructor: string;
}

const BORROWERS_STORAGE_KEY = '@borrowers_list';

const courseOptions = {
  CEIT: [
    { label: "Bachelor of Science in Electronics(BSECE)", value: "BSECE" },
    { label: "Bachelor of Science in Electrical(BSEE)", value: "BSEE" },
    { label: "Bachelor of Science in Computer(BSCoE)", value: "BSCoE" },
    { label: "Bachelor of Science in (BSIS)", value: "BSIS" },
    { label: "Bachelor of Science in (BSInfoTech)", value: "BSInfoTech" },
    { label: "Bachelor of Science in (BSCS)", value: "BSCS" },
  ],
  CTE: [
    { label: "BSED - English", value: "BSED-ENGLISH" },
    { label: "BSED - Filipino", value: "BSED-FILIPINO" },
    { label: "BSED - Mathematics", value: "BSED-MATH" },
    { label: "BSED - Sciences", value: "BSED-SCIENCES" },
    { label: "BEED", value: "BEED" },
    { label: "BPED", value: "BPED" },
    { label: "BTVTED", value: "BTVTED" },
  ],
  COT: [
    { label: "Bachelor in Electrical (BEET)", value: "BEET" },
    { label: "Bachelor in Electronics (BEXET)", value: "BEXET" },
    { label: "Bachelor in Mechanical (BMET)", value: "BMET" },
    { label: "Mechanical Technology (BMET‑MT)", value: "BMET-MT" },
    { label: "Refrigeration & (BMET‑RAC)", value: "BMET-RAC" },
    { label: "Architectural Drafting (BSIT‑ADT)", value: "BSIT-ADT" },
    { label: "Automotive Technology (BSIT‑AT)", value: "BSIT-AT" },
    { label: "Electrical Technology (BSIT‑ELT)", value: "BSIT-ELT" },
    { label: "Electronics Technology (BSIT‑ET)", value: "BSIT-ET" },
    { label: "Mechanical Technology (BSIT‑MT)", value: "BSIT-MT" },
    { label: "Welding & Fabrication (BSIT‑WAF)", value: "BSIT-WAF" },
    { label: "Heating, Ventilation, (BSIT‑HVACR)", value: "BSIT-HVACR" },
  ],
  CAS: [
    { label: "Bachelor of Science in(BSES)", value: "BSES" },
    { label: "Bachelor of Science in (BSMATH)", value: "BSMATH" },
    { label: "Bachelor of Arts in (BA‑EL)", value: "BA-EL" },
  ],
};

const BorrowForm = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { itemId, itemName, availableUnits } = params;

  const [form, setForm] = useState<FormData>({
    name: "",
    idNumber: "",
    year: "",
    department: "",
    course: "",
    timeIn: "",
    timeOut: "",
    instructor: "",
  });

  const [availableCourses, setAvailableCourses] = useState<Array<{label: string, value: string}>>([]);

  useEffect(() => {
    if (form.department) {
      setAvailableCourses(courseOptions[form.department as keyof typeof courseOptions] || []);
      // Reset course when department changes
      setForm(prev => ({ ...prev, course: "" }));
    }
  }, [form.department]);

  const handleChange = (key: keyof FormData, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const yearOptions = [
    { label: "1st Year", value: "1st Year" },
    { label: "2nd Year", value: "2nd Year" },
    { label: "3rd Year", value: "3rd Year" },
    { label: "4th Year", value: "4th Year" },
  ];

  const departmentOptions = [
    { label: "CEIT", value: "CEIT" },
    { label: "CTE", value: "CTE" },
    { label: "COT", value: "COT" },
    { label: "CAS", value: "CAS" },
  ];

  const handleSubmit = async () => {
    if (!form.name || !form.idNumber || !form.year || !form.department || 
        !form.course || !form.timeIn || !form.timeOut || !form.instructor) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Alert.alert(
      "Confirm Borrow Request",
      `Do you want to borrow ${itemName}?\n\nDetails:\nName: ${form.name}\nID: ${form.idNumber}\nDepartment: ${form.department}\nCourse: ${form.course}`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: async () => {
            // If cancelled, increase the unit count back
            await updateItemUnits(itemId as string, 1);
            router.back();
          }
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              // Get existing borrowers
              const existingBorrowers = await AsyncStorage.getItem(BORROWERS_STORAGE_KEY);
              const borrowers = existingBorrowers ? JSON.parse(existingBorrowers) : [];

              // Create new borrower record
              const newBorrower = {
                id: Date.now().toString(),
                studentName: form.name,
                studentId: form.idNumber,
                itemName: itemName,
                itemId: itemId,
                department: form.department,
                course: form.course,
                instructor: form.instructor,
                borrowDate: new Date().toISOString().split('T')[0],
                returnDate: form.timeOut,
                status: 'Borrowed' as const,
                imageUrl: (await getItems()).find(item => item.id === itemId)?.imageUrl || '',
              };

              await AsyncStorage.setItem(
                BORROWERS_STORAGE_KEY, 
                JSON.stringify([...borrowers, newBorrower])
              );

              Alert.alert(
                "Success",
                "Your borrow request has been submitted",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.push('/(tabs)/borrowers');
                    }
                  }
                ]
              );
            } catch (error) {
              // If there's an error, increase the unit count back
              await updateItemUnits(itemId as string, 1);
              console.error('Error saving borrow request:', error);
              Alert.alert("Error", "Failed to submit borrow request");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}> 
      <View style={styles.container}>
        <Text style={styles.title}>Borrow Form</Text>
        <Text style={styles.itemDetails}>Item: {itemName}</Text>
        <Text style={styles.itemDetails}>Available Units: {availableUnits}</Text>

        <TextInput 
          placeholder="Name" 
          style={styles.input} 
          value={form.name}
          onChangeText={(text) => handleChange("name", text)} 
        />
        <TextInput 
          placeholder="ID Number" 
          style={styles.input} 
          value={form.idNumber}
          onChangeText={(text) => handleChange("idNumber", text)} 
          keyboardType="numeric" 
        />

        <Text style={styles.label}>Year:</Text>
        <RNPickerSelect
          onValueChange={(value) => handleChange("year", value)}
          items={yearOptions}
          style={pickerSelectStyles}
          value={form.year}
          placeholder={{ label: "Select Year", value: null }}
        />

        <Text style={styles.label}>Department:</Text>
        <RNPickerSelect
          onValueChange={(value) => handleChange("department", value)}
          items={departmentOptions}
          style={pickerSelectStyles}
          value={form.department}
          placeholder={{ label: "Select Department", value: null }}
        />

        <Text style={styles.label}>Course:</Text>
        <RNPickerSelect
          onValueChange={(value) => handleChange("course", value)}
          items={availableCourses}
          style={pickerSelectStyles}
          value={form.course}
          placeholder={{ label: "Select Course", value: null }}
          disabled={!form.department}
        />

        <TextInput 
          placeholder="Time In" 
          style={styles.input} 
          value={form.timeIn}
          onChangeText={(text) => handleChange("timeIn", text)} 
        />
        <TextInput 
          placeholder="Time Out" 
          style={styles.input} 
          value={form.timeOut}
          onChangeText={(text) => handleChange("timeOut", text)} 
        />
        <TextInput 
          placeholder="Instructor Name" 
          style={styles.input} 
          value={form.instructor}
          onChangeText={(text) => handleChange("instructor", text)} 
        />

        <Button title="Submit" onPress={handleSubmit} color="#28a745" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  itemDetails: {
    fontSize: 16,
    marginBottom: 10,
    color: "#28a745",
    fontWeight: "500",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 15,
  }
});

export default BorrowForm;
