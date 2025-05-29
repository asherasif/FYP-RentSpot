import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import moment from "moment";
import logo from "../assets/images/RLogo.png";
import axios from "axios";
import { API_URL } from "@env";
import {AuthContext} from "./../context/AuthContext";

const RideHistory = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rideHistory, setRideHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user } = useContext(AuthContext);

  const fetchDeliveryHistory = async () => {
    try {
      setIsLoading(true);
      
     
      const headers = {
        
        "Content-Type": "application/json",
      };

    
      const [incomingResponse, outgoingResponse] = await Promise.all([
        axios.get(`${API_URL}/api/bookings/incomingrequests/`, { headers }),
        axios.get(`${API_URL}/api/bookings/myrequests/`, { headers })
      ]);

      
      const allBookings = [...incomingResponse.data, ...outgoingResponse.data];
      
   
      if (allBookings.length === 0) {
        console.log("No delivery history found, using test data");
        const testDeliveries = [
          {
            id: 1,
            item_title: "Laptop Delivery",
            timestamp: new Date().toISOString(),
            total_price: 1500,
            delivery_status: "delivered",
            category: "electronics"
          },
          {
            id: 2,
            item_title: "Camera Equipment",
            timestamp: new Date(Date.now() - 86400000).toISOString(), // yesterday
            total_price: 2500,
            delivery_status: "delivered",
            category: "electronics"
          }
        ];
        setRideHistory(testDeliveries);
      } else {
  
        const deliveredBookings = allBookings
          .filter(booking => booking.delivery_status === "delivered")
          .map(booking => ({
            id: booking.booking_id || booking.id,
            image: booking.image_url,
            title: booking.item_title,
            timestamp: booking.created_at || new Date().toISOString(),
            price: booking.total_price || 1500,
            category: "delivery",
            status: booking.delivery_status || "delivered"
          }));
        
        setRideHistory(deliveredBookings);
      }
    } catch (error) {
      console.error("Error fetching delivery history:", error);
      

      Alert.alert(
        "Error",
        "Failed to load delivery history. Using test data instead.",
        [{ text: "OK" }]
      );
      

      const testDeliveries = [
        {
          id: 1,
          title: "Laptop Delivery",
          timestamp: new Date().toISOString(),
          price: 1500,
          category: "electronics"
        },
        {
          id: 2,
          title: "Camera Equipment",
          timestamp: new Date(Date.now() - 86400000).toISOString(), // yesterday
          price: 2500,
          category: "electronics"
        }
      ];
      setRideHistory(testDeliveries);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeliveryHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveryHistory();
  };

  const handleViewRide = (rideId) => {
    router.push(`/Riderscreen?bookingId=${rideId}`);
  };

  const Card = ({ ride }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewRide(ride.id)}
    >
      <Image
        source={ride.image ? { uri: ride.image } : logo}
        resizeMode="contain"
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>
          {ride.title?.slice(0, 25) || "Delivery"}
          {ride.title?.length > 25 && "..."}
        </Text>
        <Text style={styles.time}>
          {moment(ride.timestamp).format("MMMM Do YYYY")}
        </Text>
        <Text style={styles.price}>PKR {ride.price}</Text>

        <View style={styles.bottomRow}>
          <View style={[styles.categoryTag, styles.sportsCategory]}>
            <Text style={styles.statusText}>
              {ride.status || ride.category || "Delivered"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery History</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : rideHistory.length > 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3498db"]}
              tintColor="#ffffff"
            />
          }
        >
          {rideHistory.map((ride) => (
            <Card key={`ride_${ride.id}`} ride={ride} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No delivery history found</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.browseButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

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
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  browseButton: {
    backgroundColor: "#475FCB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E2D",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 150,
    marginBottom: 11,
    elevation: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  time: {
    color: "#FFFFFF",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#FFFFFF",
  },
  categoryTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: "#FFFFFF",
  },
  sportsCategory: {
    backgroundColor: "#005fff",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
});

export default RideHistory;
