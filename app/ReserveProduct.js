import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import moment from "moment";
import axios from "axios";
import {AuthContext} from "./../context/AuthContext";
import racquet from "../assets/images/racquet.jpg";

import { API_URL } from "@env";

const ReserveProduct = () => {
  const { productId } = useLocalSearchParams();
  console.log("Item ID check from params:", productId);

  const { token } = useContext(AuthContext);
  console.log("Auth Token:", token);

  const router = useRouter();

  const [product, setProduct] = useState({
    title: "",
    displayPrice: 0,
    image: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState({});

  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsDataLoading(true);
        const response = await axios.get(`${API_URL}/api/items/get/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Product data fetched:", response.data);
        
        
        setProduct({
          title: response.data.title || "Product Name",
          displayPrice: response.data.price || 0,
        
          image: response.data.image,
        });
      } catch (error) {
        console.error("Error fetching product:", error.response?.data || error.message);
        Alert.alert(
          "Error",
          "Failed to load product details. Please try again."
        );
      } finally {
        setIsDataLoading(false);
      }
    };

    if (productId && token) {
      fetchProductData();
    }
  }, [productId, token]);

  const handleDateSelection = (day) => {
    console.log("Selected Date:", day.dateString);
    if (!selectedRange.startDate) {
      setSelectedRange({ startDate: day.dateString });
    } else if (!selectedRange.endDate) {
      setSelectedRange((prev) => ({ ...prev, endDate: day.dateString }));
    } else {
      setSelectedRange({ startDate: day.dateString });
    }
    console.log("Updated Date Range:", selectedRange);
  };

  const generateMarkedDates = () => {
    const markedDates = {};
    if (selectedRange.startDate) {
      markedDates[selectedRange.startDate] = {
        startingDay: true,
        color: "#2a9d8f",
        textColor: "white",
      };
    }
    if (selectedRange.endDate) {
      markedDates[selectedRange.endDate] = {
        endingDay: true,
        color: "#2a9d8f",
        textColor: "white",
      };
      const start = moment(selectedRange.startDate);
      const end = moment(selectedRange.endDate);
      for (
        let m = start.clone().add(1, "day");
        m.isBefore(end, "day");
        m.add(1, "day")
      ) {
        markedDates[m.format("YYYY-MM-DD")] = {
          color: "#88d8b0",
          textColor: "white",
        };
      }
    }
    return markedDates;
  };

  const handleConfirmPayment = async () => {
    if (!selectedRange.startDate || !selectedRange.endDate) {
      return Alert.alert("Error", "Please select both start and end dates.");
    }

    setIsLoading(true);
    const totalDays =
      moment(selectedRange.endDate).diff(selectedRange.startDate, "days") + 1;
    const totalPrice = product.displayPrice * totalDays;

    console.log("Booking request data:", {
      item_id: productId,
      start_date: selectedRange.startDate,
      end_date: selectedRange.endDate,
    });

    try {
      const response = await axios.post(
        `${API_URL}/api/bookings/confirm/`,
        {
          item_id: productId,
          start_date: selectedRange.startDate,
          end_date: selectedRange.endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Booking Request successful:", response.data);
      Alert.alert("Success", "Booking Request Sent Successfully, Kindly Wait for Approval. ", [
        { text: "OK", onPress: () => router.push("/home") },
      ]);
    } catch (error) {
      console.error("Booking error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to book item. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1" style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FlatList
            data={product.imageids}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={item}
                style={styles.productImage}
                resizeMode="center"
              />
            )}
          />
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>
            PKR {product.displayPrice}{" "}
            <Text style={styles.pricePerDay}>/day</Text>
          </Text>
          <View style={styles.datePickerContainer}>
            <Text style={styles.sectionTitle}>Select Dates</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={handleDateSelection}
                markingType={"period"}
                markedDates={generateMarkedDates()}
                minDate={moment().format("YYYY-MM-DD")}
                maxDate={moment().add(3, "months").format("YYYY-MM-DD")}
                theme={{
                  todayTextColor: "#2a9d8f",
                  arrowColor: "#2a9d8f",
                  selectedDayBackgroundColor: "#2a9d8f",
                  calendarBackground: "#1E1E2D",
                  textDayFontWeight: "bold",
                  textSectionTitleColor: "#CDCDE0",
                  textDisabledColor: "#555",
                  dayTextColor: "#CDCDE0",
                  textMonthFontWeight: "bold",
                  monthTextColor: "#CDCDE0",
                }}
              />
            </View>
          </View>
          <View style={styles.priceDetailsContainer}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total days</Text>
              {selectedRange.endDate ? (
                <Text style={styles.priceValue}>
                  {moment(selectedRange.endDate).diff(
                    selectedRange.startDate,
                    "days"
                  ) + 1}
                </Text>
              ) : (
                <Text style={styles.errorText}>Please select dates</Text>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per day</Text>
              <Text style={styles.priceValue}>{product.displayPrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service fee</Text>
              <Text style={styles.priceValue}>
                {Math.floor(product.displayPrice * 0.1)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                PKR{" "}
                {selectedRange.endDate
                  ? Math.floor(
                      product.displayPrice * 0.1 +
                        product.displayPrice *
                          (moment(selectedRange.endDate).diff(
                            selectedRange.startDate,
                            "days"
                          ) + 1)
                    )
                  : Math.floor(
                      product.displayPrice * 0.1 + product.displayPrice
                    )}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmPayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161622",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: "#CDCDE0",
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  productImage: {
    width: 300,
    height: 200,
    borderRadius: 20,
    marginRight: 20,
    marginLeft: 10,
  },
  productTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#CDCDE0",
    marginBottom: 8,
    marginTop: 25,
  },
  productPrice: {
    fontSize: 20,
    color: "#2a9d8f",
    marginBottom: 16,
  },
  pricePerDay: {
    fontSize: 19,
    color: "#CDCDE0",
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  calendarContainer: {
    backgroundColor: "#1E1E2D",
    borderRadius: 20,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#CDCDE0",
  },
  priceDetailsContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#1E1E2D",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#CDCDE0",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#CDCDE0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#CDCDE0",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  confirmButton: {
    backgroundColor: "#2a9d8f",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
  },
});

export default ReserveProduct;