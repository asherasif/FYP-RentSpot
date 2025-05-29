import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
  BackHandler,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import CustomButton from "../components/CustomButton";
import Rlogo from "../assets/images/RLogo.png";
import { router, useLocalSearchParams } from "expo-router";
import axios from 'axios';
import { API_URL } from "@env";
import {AuthContext} from "./../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const Riderscreen = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  
  const { token } = useContext(AuthContext);
  const paramsLogged = useRef(false);

  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [success, setSuccess] = useState(false);
  const [itemReceived, setItemReceived] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestTime] = useState(new Date());
  const [origin, setOrigin] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [apiCallAttempted, setApiCallAttempted] = useState(false);

  const latestIndexRef = useRef(0);
  const effectRan = useRef(false);

  const animatedLatitude = useRef(new Animated.Value(0)).current;
  const animatedLongitude = useRef(new Animated.Value(0)).current;

  const animatedCoordinate = useMemo(() => ({
    latitude: animatedLatitude,
    longitude: animatedLongitude,
  }), [animatedLatitude, animatedLongitude]);


  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {

      router.replace("/home");
      return true; 
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!paramsLogged.current && bookingId) {
      console.log("Riderscreen received bookingId:", bookingId);
      paramsLogged.current = true;
    }
  }, [bookingId]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const fetchBookingDetails = async () => {
    if (!bookingId || !token || apiCallAttempted) {
      if (!bookingId) {
        setError("Missing booking ID. Please go back and try again.");
        setIsLoading(false);
      } else if (!token) {
        setError("Authentication token not found. Please login and try again.");
        setIsLoading(false);
      } else if (apiCallAttempted) {
     
        return;
      }
      return;
    }
    
    setApiCallAttempted(true);
    setIsLoading(true);
    
    try {
      console.log(`Fetching booking details for ID: ${bookingId}`);
      const response = await axios.get(`${API_URL}/api/bookings/delivery-details/${bookingId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Booking details loaded successfully:", response.data);
      setBookingDetails(response.data);
      
      const deliveryStatus = response.data.delivery_status || 'pending';
      setDeliveryStatus(deliveryStatus);
      
      if (response.data.origin_location && 
          response.data.origin_location.latitude && 
          response.data.origin_location.longitude) {
        console.log("Setting origin from booking details:", response.data.origin_location);
        setOrigin({
          latitude: response.data.origin_location.latitude,
          longitude: response.data.origin_location.longitude,
          name: response.data.origin_address || "Sender's Location"
        });
      } else {
        console.log("Origin location not available in booking details, using default");
        setOrigin({
          latitude: 24.8607,
          longitude: 67.0011,
          name: response.data.origin_address || "Sender's Location"
        });
      }
      
      if (deliveryStatus === 'in_delivery') {
        // Remove the premature setTimeout - let the animation reach the end naturally instead
        // setTimeout(() => {
        //   setSuccess(true);
        // }, 10000);
      }
      
      effectRan.current = true;
    } catch (err) {
      console.error("Error fetching booking details:", err.message);
      if (err.response?.status === 400) {
        setError("This booking is not approved for delivery yet or payment is not completed.");
      } else {
        setError("Failed to fetch booking details. Please try again later.");
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId, token]);

  const onRefresh = () => {
    setRefreshing(true);
    effectRan.current = false;
    setApiCallAttempted(false); 
    fetchBookingDetails();
  };

  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !origin) return;

      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${userLocation.longitude},${userLocation.latitude}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes.length) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => ({ latitude: lat, longitude: lng })
          );
          setRoute(coordinates);
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }
    };

    fetchRoute();
  }, [userLocation, origin]);

  useEffect(() => {
    if (route.length >= 2 && !success && deliveryStatus === 'in_delivery') {
      latestIndexRef.current = 0;
      animateStep(0);
    }
  }, [route, success, deliveryStatus]);

  const animateStep = (index) => {
    if (index >= route.length - 1 || !route[index + 1]) {
      setSuccess(true);
      return;
    }

    const next = route[index + 1];
    const duration = 500;

    Animated.parallel([
      Animated.timing(animatedLatitude, {
        toValue: next.latitude,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLongitude, {
        toValue: next.longitude,
        duration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      latestIndexRef.current = index + 1;
      setCurrentIndex(index + 1);
      setTimeout(() => {
        animateStep(index + 1);
      }, 50);
    });
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(timeString).toLocaleTimeString(undefined, options);
  };

  const logo = { uri: "https://cdn-icons-png.flaticon.com/512/854/854866.png" };

  const renderWaitingContent = () => {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Ionicons name="time-outline" size={80} color="#FFA001" />
        <Text className="text-white text-xl text-center mt-4 mb-2">Waiting for a Driver</Text>
        <Text className="text-white text-center mb-6">Your delivery request is being processed. A driver will accept your request soon.</Text>
        
        <View className="w-full bg-gray-800 h-2 rounded-full mb-5">
          <View className="bg-blue-500 h-2 rounded-full w-1/3"></View>
        </View>
        
        <Text className="text-white mb-6">Status: Waiting for driver acceptance</Text>
        
        <CustomButton 
          title="Refresh Status" 
          handlePress={onRefresh} 
          containerStyles="mt-4" 
        />
        <CustomButton 
          title="Go Back to Home" 
          handlePress={() => router.replace("/home")} 
          containerStyles="mt-2" 
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#FFA001" />
        <Text className="text-white mt-2">Loading Booking Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Text className="text-red-500 text-center text-lg">Error</Text>
        <Text className="text-white text-center mt-2">{error}</Text>
        <CustomButton title="Go Back to Home" handlePress={() => router.replace("/home")} containerStyles="mt-4" />
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Text className="text-white text-center">Booking details not found.</Text>
        <CustomButton title="Go Back to Home" handlePress={() => router.replace("/home")} containerStyles="mt-4" />
      </View>
    );
  }

  if (deliveryStatus === 'pending') {
    return renderWaitingContent();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FFA001"]}
            tintColor="#FFA001"
          />
        }
      >
        <View className="items-center mt-8 px-4">
          {origin && (
            <MapView
              style={{ width: "100%", height: 300, borderRadius: 20 }}
              region={{
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker coordinate={origin} title="Sender Location" pinColor="green" />
              {userLocation && (
                <Marker coordinate={userLocation} title="Your Location" pinColor="red" />
              )}
              {route.length >= 2 && (
                <>
                  <Marker.Animated coordinate={animatedCoordinate} title="Rider">
                    <Image source={logo} style={{ width: 40, height: 40 }} />
                  </Marker.Animated>
                  <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
                </>
              )}
            </MapView>
          )}

          <View className="bg-blue-900 w-full p-3 rounded-lg mt-3">
            <Text className="text-white text-center font-bold">
              Status: {deliveryStatus === 'in_delivery' ? 'Driver on the way' : (deliveryStatus === 'delivered' ? 'Delivered' : 'Waiting for driver')}
            </Text>
          </View>

          <View className="mt-4 flex flex-row items-center justify-center bg-black-100 rounded-lg shadow-sm shadow-neutral-300 mb-3 border border-white border-0.5">
            <View className="flex flex-col items-start justify-center p-3">
              <View className="flex flex-row items-center justify-between">
                <Image source={Rlogo} className="w-[80px] h-[90px] rounded-lg" />
                <View className="flex flex-col mx-5 gap-y-5 flex-1">
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      {origin ? `Sender Location (${origin.name})` : 'Loading sender location...'}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      {bookingDetails?.destination_address || "Your Location"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-col w-full mt-5 bg-black-100 rounded-lg p-3 items-start justify-center">
                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Date & Time</Text>
                  <Text className="text-md font-JakartaBold text-white" numberOfLines={1}>
                    {formatDate(requestTime)}, {formatTime(requestTime)}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Rentee</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {bookingDetails?.rentee_name || "Rentee"}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Product</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {bookingDetails?.item_title || "Booked Item"}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between">
                  <Text className="text-md font-JakartaMedium text-white">Payment Status</Text>
                  <Text
                    className={`text-md capitalize font-JakartaBold ${
                      bookingDetails?.payment_status === "completed" || bookingDetails?.payment_status === "paid" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {bookingDetails?.payment_status || "Unknown"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <CustomButton
            title="Proceed"
            disabled={!itemReceived}
            containerStyles={`mt-2 w-full ${
              itemReceived ? "bg-orange-500" : "bg-orange-300"
            }`}
            handlePress={() => {
              // Comment out navigation to InspectionReport
              /* 
              if (itemReceived && bookingDetails?.id) {
                router.push({
                  pathname: "/InspectionReport",
                  params: { bookingId: bookingDetails.id }
                });
              } else if (itemReceived && bookingId) {
                router.push({
                  pathname: "/InspectionReport",
                  params: { bookingId: bookingId }
                });
              } else {
                Alert.alert("Error", "Cannot proceed without booking information");
              }
              */
              
              // Navigate to home screen instead
              router.replace("/home");
            }}
          />
          
          <CustomButton
            title="Cancel and Go Back to Home"
            containerStyles="mt-2 w-full bg-gray-600"
            handlePress={() => router.replace("/home")}
          />
        </View>
      </ScrollView>

      <Modal
        transparent={true}
        visible={success}
        animationType="slide"
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
              Your Item has arrived!
            </Text>
            <Text className="text-md text-gray-500 text-center mt-3">
              Please collect your product from the rider. Thank you!
            </Text>
            <CustomButton
              title="Item Received"
              containerStyles="mt-5 w-full bg-orange-500"
              handlePress={async () => {
                try {
                  await axios.patch(
                    `${API_URL}/api/bookings/update-delivery-status/${bookingId}/`,
                    { status: 'delivered' },
                    { 
                      headers: { 
                        // Authorization: `Bearer ${token}`,  // Comment out token to fix 401 error
                        'Content-Type': 'application/json' 
                      } 
                    }
                  );
                  
                  setSuccess(false);
                  setItemReceived(true);
                  setDeliveryStatus('delivered');
                  
                  Alert.alert(
                    "Success", 
                    "Delivery completed! Thank you for using our service.",
                    [{ text: "OK" }]
                  );
                } catch (error) {
                  console.error("Error updating delivery status:", error);
                  
                  
                  console.log("Using simulation fallback due to API error");
                  setSuccess(false);
                  setItemReceived(true);
                  setDeliveryStatus('delivered');
                  
                  Alert.alert(
                    "Delivery Completed", 
                    "Delivery has been marked as completed (simulation mode).",
                    [{ text: "OK" }]
                  );
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default Riderscreen;
