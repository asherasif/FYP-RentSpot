import React, { useState, useEffect, useContext, useCallback, memo } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from 'axios';
import { API_URL } from "@env";
import {AuthContext} from "./../context/AuthContext";

const MyProductsList = () => {
  const [selectedTab, setSelectedTab] = useState("reservation");
  const [reservations, setReservations] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { token, user } = useContext(AuthContext);
  const [returnInitiatedModalVisible, setReturnInitiatedModalVisible] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [initiateReturnLoading, setInitiateReturnLoading] = useState(false);


  useEffect(() => {
    if (selectedTab === "reservation") {
      setMyItems([]);
    } else {
      setReservations([]);
    }
  }, [selectedTab]);

 
  const refreshReservations = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);


  const fetchReservations = useCallback(async () => {
    if (!token) {
      console.error('No auth token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const timestamp = new Date().getTime();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      console.log("Fetching reservations from:", `${API_URL}/api/bookings/reservations/?_t=${timestamp}`);
      console.log("Current user:", user?.id, user?.username);
      
      const response = await axios.get(
        `${API_URL}/api/bookings/reservations/?_t=${timestamp}`,
        { headers }
      );

      console.log("API Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        console.log("Setting reservations:", response.data);
        setReservations(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error.message);
      console.error("Error response:", error.response?.data);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  const fetchMyItems = useCallback(async () => {
    if (!token) {
      console.error('No auth token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
  
      const timestamp = new Date().getTime();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      console.log("Fetching my items from:", `${API_URL}/api/items/myitems/?_t=${timestamp}`);
      console.log("Current user:", user?.id, user?.username);
      
      const response = await axios.get(
        `${API_URL}/api/items/myitems/?_t=${timestamp}`,
        { headers }
      );

      console.log("My Items API Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        console.log("Setting my items:", response.data);
        setMyItems(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setMyItems([]);
      }
    } catch (error) {
      console.error("Error fetching my items:", error.message);
      console.error("Error response:", error.response?.data);
      setMyItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {

    setMyItems([]);
    setReservations([]);
    setRefreshTrigger(prev => prev + 1);
  }, [user?.id]);


  useEffect(() => {
    if (selectedTab === "reservation") {
      fetchReservations();
    } else {
      fetchMyItems();
    }
  }, [fetchReservations, fetchMyItems, refreshTrigger, selectedTab, user?.id]);

  const handleCancelReservation = useCallback(async (reservationId) => {
    if (!token || !reservationId) return;

    try {

      setReservations(prev =>
        prev.filter(item => item.id !== reservationId)
      );

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.delete(
        `${API_URL}/api/bookings/cancel/${reservationId}/`,
        { headers }
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error.message);
   
      refreshReservations();
    }
  }, [token, refreshReservations]);


  const handleInitiateReturn = useCallback(async (bookingId) => {
    if (!token || !bookingId) return;
    setCurrentBookingId(bookingId);
    setInitiateReturnLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await axios.post(
        `${API_URL}/api/bookings/initiate-return/${bookingId}/`,
        {},
        { headers }
      );
      console.log("Return initiated response:", response.data);
      setInitiateReturnLoading(false);
      setReturnInitiatedModalVisible(true);
    } catch (error) {
      console.error("Error initiating return:", error.response?.data || error.message);
      setInitiateReturnLoading(false);
      Alert.alert("Error", "Failed to initiate return request.");
    }
  }, [token]);

  const handleProceedToHome = useCallback(() => {
    setReturnInitiatedModalVisible(false);
    router.push('/home'); 
  }, []);


  const renderDebugInfo = useCallback(() => {
    if (__DEV__) {
      return (
        <View style={{ padding: 10, borderWidth: 1, borderColor: '#666', marginBottom: 10 }}>
          <Text style={{ color: 'white', fontSize: 12 }}>Token: {token ? "Available" : "Not available"}</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>API URL: {API_URL}/api/{selectedTab === "reservation" ? "bookings/reservations/" : "items/myitems/"}</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>Items count: {selectedTab === "reservation" ? reservations.length : myItems.length}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#555', padding: 5, borderRadius: 5, marginTop: 5 }}
            onPress={refreshReservations}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [token, reservations.length, myItems.length, refreshReservations, selectedTab]);

 
  const ReservationCard = memo(({ item }) => {
    console.log("Rendering Reservation Card with item:", {
      id: item.id,
      total_price: item.total_price,
      item_name: item.item_name,
      delivery_status: item.delivery_status,
      return_status: item.return_status,
      item_id: item.item_id
    });

    return (
      <View
        key={item.id || `reservation-${Math.random()}`}
        className="bg-[#1E1E2D] rounded-lg p-4 mb-4 shadow-md"
      >
        <View className="flex-row items-center">
          <Image
            source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
            className="w-16 h-16 rounded-lg mr-4"
            style={{ width: 64, height: 64, borderRadius: 8, marginRight: 15 }}
          />
          <View className="flex-1">
            <Text className="text-lg font-semibold text-white">
              {item.item_name}
            </Text>
            <Text className="text-white">
              Owner: {item.owner_name}
            </Text>
            {item.start_date && item.end_date && (
              <Text className="text-xs text-gray-400">
                {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
              </Text>
            )}
            {item.total_price && (
              <Text className="text-blue-400">
                Total: PKR {item.total_price}
              </Text>
            )}
            <Text className="text-xs text-gray-400">
              Status: {item.delivery_status === 'delivered' ? 'Delivered' :
                      item.delivery_status === 'in_delivery' ? 'In Delivery' : 'Pending'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          className="mt-2 bg-orange-500 p-2 rounded-lg"
          onPress={() => handleInitiateReturn(item.id)}
          disabled={initiateReturnLoading}
        >
          {initiateReturnLoading && currentBookingId === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-center">
              Initiate Return
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  });


  const ItemCard = memo(({ item }) => {
    console.log("Rendering Item Card with item:", {
      id: item.id,
      title: item.title,
      price: item.price,
      latest_booking: item.latest_booking
    });


    const canFileDispute = item.latest_booking && 
      (item.latest_booking.delivery_status === 'delivered' || 
       item.latest_booking.delivery_status === 'in_delivery') && 
      (item.latest_booking.return_status === 'returned' || 
       item.latest_booking.return_status === 'in_return' || 
       item.latest_booking.return_status === 'completed');

    
    const handleFileDispute = async () => {
      try {
        
        if (item.latest_booking && item.latest_booking.id) {
          router.push({
            pathname: "DisputeForm",
            params: { 
              itemId: item.id,
              bookingId: item.latest_booking.id
            }
          });
          return;
        }


        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const response = await axios.get(
          `${API_URL}/api/bookings/item/${item.id}/latest/`,
          { headers }
        );
        
        console.log("Latest booking response:", response.data);
        
       
        if (response.data && response.data.id) {
          router.push({
            pathname: "DisputeForm",
            params: { 
              itemId: item.id,
              bookingId: response.data.id
            }
          });
        } else {
    
          router.push({
            pathname: "DisputeForm",
            params: { itemId: item.id }
          });
        }
      } catch (error) {
        console.error("Error fetching latest booking:", error);
 
        router.push({
          pathname: "DisputeForm",
          params: { itemId: item.id }
        });
      }
    };


    const getBookingStatusText = () => {
      if (!item.latest_booking) return "No booking";
      
      if (item.latest_booking.return_status === 'completed' || 
          item.latest_booking.return_status === 'returned') {
        return "Return completed";
      }
      
      if (item.latest_booking.return_status === 'in_return') {
        return "Return in progress";
      }
      
      if (item.latest_booking.delivery_status === 'delivered') {
        return "Delivered";
      }
      
      if (item.latest_booking.delivery_status === 'in_delivery') {
        return "In delivery";
      }
      
      return "Booking " + item.latest_booking.status;
    };

    return (
      <View
        key={item.id || `item-${Math.random()}`}
        className="bg-[#1E1E2D] rounded-lg p-4 mb-4 shadow-md"
      >
        <View className="flex-row items-center">
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            className="w-16 h-16 rounded-lg mr-4"
            style={{ width: 64, height: 64, borderRadius: 8, marginRight: 15 }}
          />
          <View className="flex-1">
            <Text className="text-lg font-semibold text-white">
              {item.title}
            </Text>
            <Text className="text-white">
              Price: PKR {item.price}/day
            </Text>
            <Text className="text-xs text-gray-400">
              {item.description?.substring(0, 50)}...
            </Text>
          </View>
        </View>
        {canFileDispute && (
          <TouchableOpacity
            className="mt-2 bg-red-500 p-2 rounded-lg"
            onPress={handleFileDispute}
          >
            <Text className="text-white text-center">
              File Dispute
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  });

  const handleReservationTab = useCallback(() => {
    setSelectedTab("reservation");
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleCompletedTab = useCallback(() => {
    setSelectedTab("completed");
    setRefreshTrigger(prev => prev + 1);
  }, []);


  useEffect(() => {

    setMyItems([]);
    setReservations([]);
    
    console.log("MyProductsList mounted with user:", user?.id, user?.username);
    
    return () => {
 
      setMyItems([]);
      setReservations([]);
    };
  }, []);

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity onPress={refreshReservations} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View className="flex-1 p-5 bg-[#161622]">
        <View className="flex-row justify-center">
          <TouchableOpacity
            onPress={handleReservationTab}
            className={`p-2 ${
              selectedTab === "reservation" ? "border-b-2 border-blue-500" : ""
            }`}
          >
            <Text className="text-lg font-semibold text-white">
              Reservation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCompletedTab}
            className={`p-2 ${
              selectedTab === "completed" ? "border-b-2 border-blue-500" : ""
            }`}
          >
            <Text className="text-lg font-semibold text-white">Completed</Text>
          </TouchableOpacity>
        </View>



        <ScrollView className="mt-4">
          {loading ? (
            <View className="items-center justify-center p-4">
              <ActivityIndicator size="large" color="#3498db" />
              <Text className="text-white mt-2">Loading {selectedTab === "reservation" ? "reservations" : "items"}...</Text>
            </View>
          ) : selectedTab === "reservation" ? (
            reservations.length === 0 ? (
              <Text className="text-center text-white mt-4">
                No reservations found
              </Text>
            ) : (
              reservations.map((item) => (
                <ReservationCard
                  key={item.id || `reservation-${Math.random()}`}
                  item={item}
                />
              ))
            )
          ) : myItems.length === 0 ? (
            <Text className="text-center text-white mt-4">
              You haven't created any items yet
            </Text>
          ) : (
          
            (() => {
              const eligibleItems = myItems.filter(item => 
                item.latest_booking && (
                 
                  (item.latest_booking.delivery_status === 'delivered' || 
                   item.latest_booking.delivery_status === 'in_delivery') && 
                  (item.latest_booking.return_status === 'returned' || 
                   item.latest_booking.return_status === 'in_return' || 
                   item.latest_booking.return_status === 'completed')
                  
                  // For testing/development, uncomment this to include all items with any booking
                  // || item.latest_booking.id
                )
              );
              
              if (eligibleItems.length === 0) {
                return (
                  <Text className="text-center text-white mt-4">
                    No items with completed bookings found
                  </Text>
                );
              }
              
              return eligibleItems.map((item) => (
                <ItemCard
                  key={item.id || `item-${Math.random()}`}
                  item={item}
                />
              ));
            })()
          )}
        </ScrollView>
      </View>
      <Modal
        transparent={true}
        visible={returnInitiatedModalVisible}
        animationType="slide"
        onRequestClose={() => setReturnInitiatedModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View className="bg-white p-7 rounded-2xl w-[90%] max-w-[400px] items-center">
            <Text className="text-2xl text-center font-bold mt-5 text-black">Return Initiated</Text>
            <Text className="text-md text-gray-500 text-center mt-3 mb-4">A Rider Will pick up the Item from you and deliver it to owner. Please Proceed.</Text>
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
              onPress={handleProceedToHome}
            >
              <Text className="text-white text-center">Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
    flex: 1,
  },
  refreshButton: {
    padding: 5,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    color: "FFFFFF",
  },
  sportsCategory: {
    backgroundColor: "#005fff", // Navy blue
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-end",
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

export default MyProductsList;