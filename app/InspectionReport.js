import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "../constants/icons";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import Modal from "react-native-modal";
import logo from "../assets/images/RLogo.png";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "@env";
import {AuthContext} from "./../context/AuthContext";

const inspectionCategories = [
  { name: "Item Working Properly" },
  { name: "Item Damaged" },
  { name: "Minor Scratches / Wear" },
];

const InspectionReport = () => {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const { token, user } = useContext(AuthContext);

  const [form, setForm] = useState({
    category: "",
    description: "",
    image: null,
  });

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      Alert.alert(
        "Missing Information",
        "Booking ID is required to create an inspection report.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
    }
  }, [bookingId]);

  const openPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
      });

      if (!result.canceled) {
        const { uri, name, mimeType } = result.assets[0];
        setForm({
          ...form,
          image: {
            uri: uri.startsWith("file://") ? uri : `file://${uri}`,
            name: name || "image.jpg",
            type: mimeType || "image/jpeg",
          },
        });
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const handleSubmit = async () => {
    if (!form.category || !form.description || !form.image) {
      Alert.alert("Missing Fields", "Please complete all fields before submitting.");
      return;
    }

    if (!bookingId) {
      Alert.alert("Error", "Booking ID is missing.");
      return;
    }

    if (!user || !user.id) {
      Alert.alert("Error", "User information is missing. Please log in again.");
      return;
    }

    setUploading(true);
    
    try {
   
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('report_type', 'checkout');
      formData.append('overall_condition', form.category);
      formData.append('notes', form.description);
      formData.append('reported_by_id', user.id);
      formData.append('checkout_image', {
        uri: form.image.uri,
        name: form.image.name,
        type: form.image.type
      });
      
     
      const response = await axios.post(
        `${API_URL}/api/condition_reports/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Inspection report submitted:", response.data);
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting inspection report:", error.response?.data || error.message);
      Alert.alert(
        "Submission Failed", 
        "Failed to submit inspection report. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection Report</Text>
      </View>

      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">File your Inspection Report</Text>

     
        <View className="mt-10 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">Inspection Category</Text>
          <View className="bg-black-100 border border-black-200 rounded-xl">
            <Picker
              selectedValue={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
              style={{ color: "white", height: 50, marginHorizontal: 10 }}
            >
              <Picker.Item label="Select a category" value="" />
              {inspectionCategories.map((item) => (
                <Picker.Item key={item.name} label={item.name} value={item.name} />
              ))}
            </Picker>
          </View>
        </View>
       <FormField
          title="Description"
          value={form.description}
          placeholder="Describe the inspection results in detail..."
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyles="mt-4 mb-3"
        />


        <View className="mt-4 mb-3 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">Upload Image</Text>
          <TouchableOpacity onPress={openPicker}>
            {form.image ? (
              <Image source={{ uri: form.image.uri }} resizeMode="cover" className="w-full h-64 rounded-2xl" />
            ) : (
              <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                  <Image source={icons.upload} resizeMode="contain" alt="upload" className="w-1/2 h-1/2" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

      
        <CustomButton
          title="Submit Report"
          containerStyles="mt-7"
          isLoading={uploading}
          handlePress={handleSubmit}
        />

      
        <Modal isVisible={success} onBackdropPress={() => setSuccess(false)}>
          <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
            <Image source={logo} className="w-28 h-28 mt-5" />
            <Text className="text-2xl text-center font-bold mt-5 text-black">
              Inspection Submitted!
            </Text>
            <Text className="text-md text-gray-500 text-center mt-3">
              Thank you. Your inspection report has been filed successfully. Please proceed to deliver item to Renter.
            </Text>
            <CustomButton
              title="Back Home"
              containerStyles="mt-5 w-full"
              handlePress={() => {
                setSuccess(false);
                router.push("/vendorhome");
              }}
            />
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InspectionReport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#161622",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#1E1E2D",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
});
