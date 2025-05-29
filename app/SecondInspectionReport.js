import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Modal,
  BackHandler,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "../constants/icons";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
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

const SecondInspectionReport = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const { token, user } = useContext(AuthContext);

  const [form, setForm] = useState({
    category: "",
    description: "",
    image: null,
  });

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingReportId, setExistingReportId] = useState(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {

      router.replace("/vendorhome");
      return true; 
    });

    return () => backHandler.remove();
  }, []);

  
  useEffect(() => {
    console.log("SecondInspectionReport - Received bookingId:", bookingId);
    console.log("SecondInspectionReport - All params:", params);
  }, [bookingId, params]);

  useEffect(() => {
    if (!bookingId) {
      Alert.alert(
        "Missing Information",
        "Booking ID is required to create a return inspection report.",
        [{ text: "Go Back", onPress: () => router.replace("/vendorhome") }]
      );
    } else {
      
      checkExistingReport();
    }
  }, [bookingId]);

  const checkExistingReport = async () => {
    if (!bookingId || !token) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/api/condition_reports/?booking_id=${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Existing reports:", response.data);
      
      
      const returnReport = response.data.find(report => report.report_type === 'return');
      
      if (returnReport) {
        console.log("Found existing return report:", returnReport);
        setExistingReportId(returnReport.id);
        
       
        setForm({
          category: returnReport.overall_condition || "",
          description: returnReport.notes || "",
          image: returnReport.return_image ? { uri: returnReport.return_image } : null,
        });
        
        Alert.alert(
          "Existing Report Found",
          "A return inspection report already exists for this booking. Your changes will update the existing report."
        );
      }
    } catch (error) {
      console.error("Error checking for existing reports:", error);
    }
  };

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
      console.log("Submitting return inspection report for booking ID:", bookingId);
      

      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('report_type', 'return');
      formData.append('overall_condition', form.category);
      formData.append('notes', form.description);
      formData.append('reported_by_id', user.id);
      formData.append('return_image', {
        uri: form.image.uri,
        name: form.image.name,
        type: form.image.type
      });
      
    
      console.log("FormData for return inspection report:");
      console.log("booking_id:", bookingId);
      console.log("report_type: return");
      console.log("overall_condition:", form.category);
      console.log("notes:", form.description);
      console.log("reported_by_id:", user.id);
      console.log("return_image:", form.image);
      
      let response;
      
      if (existingReportId) {
       
        console.log("Updating existing return report with ID:", existingReportId);
        response = await axios.put(
          `${API_URL}/api/condition_reports/${existingReportId}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log("Return inspection report updated:", response.data);
      } else {
      
        response = await axios.post(
          `${API_URL}/api/condition_reports/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log("Return inspection report submitted:", response.data);
      }
      
      console.log("Checking report_type in response:", response.data.report_type);
      console.log("Full API response for debugging:", JSON.stringify(response.data, null, 2));
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting return inspection report:", error);
      
      let errorMessage = "Failed to submit return inspection report. ";
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);
        
        // Check for specific error types
        if (error.response.status === 400) {
          if (error.response.data.non_field_errors && 
              error.response.data.non_field_errors.includes("The fields booking, report_type must make a unique set.")) {
            errorMessage += "A return report already exists for this booking.";
          } else {
            errorMessage += "Invalid data submitted. Please check all fields.";
          }
        } else if (error.response.status === 401) {
          errorMessage += "Authentication error. Please log in again.";
        } else if (error.response.status === 403) {
          errorMessage += "You don't have permission to submit this report.";
        } else {
          errorMessage += "Server error. Please try again later.";
        }
      } else if (error.request) {
        errorMessage += "No response received from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      
      Alert.alert(
        "Submission Failed", 
        errorMessage
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/vendorhome")}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection Report</Text>
      </View>

      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">File your Inspection Report</Text>
        
        {bookingId ? (
          <Text className="text-sm text-gray-400 mb-4">Booking ID: {bookingId}</Text>
        ) : (
          <Text className="text-sm text-red-500 mb-4">Warning: No booking ID detected</Text>
        )}

        {/* Category Dropdown */}
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

        {/* Description Field */}
        <FormField
          title="Description"
          value={form.description}
          placeholder="Describe the inspection results in detail..."
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyles="mt-4 mb-3"
        />

        {/* Upload Image */}
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

  
        <Modal
          visible={success}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSuccess(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)'
          }}>
            <View className="bg-white p-7 rounded-2xl w-[90%] max-w-[400px]">
              <Image source={logo} className="w-28 h-28 mt-5 self-center" />
              <Text className="text-2xl text-center font-bold mt-5 text-black">
                Inspection Submitted!
              </Text>
              <Text className="text-md text-gray-500 text-center mt-3">
                Thank you. Your inspection report has been filed successfully. Please proceed.
              </Text>
              <CustomButton
                title="Go to Home"
                containerStyles="mt-5 w-full"
                handlePress={() => {
                  setSuccess(false);
                  router.replace("/vendorhome");
                }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SecondInspectionReport;

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
