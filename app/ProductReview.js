import { 
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import React, { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "react-native-modal";
import CustomButton from "../components/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import logo from "../assets/images/RLogo.png";
import {AuthContext} from "./../context/AuthContext";
import { API_URL } from "@env";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";

const ProductReview = () => {

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const router = useRouter();

const { productId } = useLocalSearchParams();

  const handlePostReview = async () => {
    console.log("checking the token being sent", token);
    console.log("Submitting Review for Item ID:", productId);


    if (!review.trim() || rating === 0) { 
      setError("All fields are required, including your rating.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/reviews/submit/`,
        {
          item: productId,

          rating,
          review,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "Review added successfully!");
      setError("");
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to submit review. Please try again.");
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Review</Text>
      </View>

      <ScrollView className="p-5">
        <Text className="text-white text-2xl font-bold mb-4">
          Leave a Review
        </Text>

        {error ? (
          <Text className="text-red-500 font-bold mb-3">{error}</Text>
        ) : null}

        {/* 
        <Text className="text-white text-lg mt-4 mb-2 font-bold">Enter Your Name</Text>
        <TextInput
          className="border border-gray-400 rounded-lg p-3 text-white"
          placeholder="Your Name"
          placeholderTextColor="white"
          value={name}
          onChangeText={setName}
        />
        */}

        <Text className="text-white text-lg mt-4 mb-2 font-bold">Rating</Text>
        <View className="flex-row border border-gray-400 rounded-lg p-3 text-white">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text
                className={`text-3xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-400"
                }`}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-white text-lg mt-4 mb-2 font-bold">
          Your Review
        </Text>
        <TextInput
          className="border border-gray-400 rounded-lg p-3 text-white h-32"
          placeholder="Write your review here..."
          placeholderTextColor="white"
          multiline
          value={review}
          onChangeText={setReview}
        />

        <CustomButton
          title="Post Review"
          containerStyles="mt-5 font-bold"
          handlePress={handlePostReview}
        />
      </ScrollView>

      <Modal
        isVisible={success}
        onBackdropPress={() => {
          setSuccess(false);
          router.push("/home");
        }}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">
            Product Review posted successfully.
          </Text>
          <Text className="text-md text-gray-500 text-center mt-3">
            Thank you for your review. Your feedback helps us improve.
          </Text>
          <CustomButton
            title="Back Home"
            containerStyles="mt-5 w-full"
            handlePress={() => {
              setSuccess(false);
              router.push("/home");
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#1E1E2D",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
});

export default ProductReview;
