import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  BackHandler,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import CustomButton from "../components/CustomButton";
import { router, useLocalSearchParams } from "expo-router";
import Rlogo from "../assets/images/RLogo.png";
import axios from "axios";
import { API_URL } from "@env";
import {AuthContext} from "./../context/AuthContext";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const ReturnMapsScreen = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const { token, user } = useContext(AuthContext);

  const [bookingDetails, setBookingDetails] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [success, setSuccess] = useState(false);
  const [itemReceived, setItemReceived] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiCallAttempted, setApiCallAttempted] = useState(false);

  const latestIndexRef = useRef(0);
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
    const fetchDetails = async () => {
      if (!bookingId || !token || apiCallAttempted) return;
      
      setApiCallAttempted(true);
      setLoading(true);
      
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(
          `${API_URL}/api/bookings/delivery-details/${bookingId}/`,
          { headers }
        );
        console.log("Booking details loaded:", response.data);
        setBookingDetails(response.data);
        
   
        if (response.data.origin_location && 
            response.data.origin_location.latitude && 
            response.data.origin_location.longitude) {
          console.log("Setting origin from booking details:", response.data.origin_location);
          setOrigin({
            latitude: response.data.origin_location.latitude,
            longitude: response.data.origin_location.longitude,
            name: response.data.origin_address || "Owner's Location"
          });
        } else {
          console.log("Origin location not available in booking details, using default");
          setOrigin({
            latitude: 24.8607,
            longitude: 67.0011,
            name: response.data.origin_address || "Owner's Location"
          });
        }
      } catch (err) {
        console.error("Failed to fetch booking details:", err);
        if (err.response?.status === 400) {
          setError("This booking is not approved for delivery yet or payment is not completed.");
        } else {
          setError("Failed to fetch booking details. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [bookingId, token, apiCallAttempted]);

  
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (e) {
        setError("Failed to get your location.");
      }
    })();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !origin) return;
   
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${origin.longitude},${origin.latitude}?overview=full&geometries=geojson`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => ({ latitude: lat, longitude: lng })
          );
          setRoute(coordinates);
        } else {
          
          generateFallbackRoute(userLocation, origin);
        }
      } catch (err) {
        console.error("Failed to fetch route:", err);

        generateFallbackRoute(userLocation, origin);
      }
    };
    fetchRoute();
  }, [userLocation, origin]);

  const generateFallbackRoute = (start, end) => {
    if (!start || !end) return;
    
    const points = [];
    points.push({ latitude: start.latitude, longitude: start.longitude });
    
    const numPoints = 8;
    for (let i = 1; i < numPoints - 1; i++) {
      const ratio = i / numPoints;
      points.push({
        latitude: start.latitude + (end.latitude - start.latitude) * ratio,
        longitude: start.longitude + (end.longitude - start.longitude) * ratio
      });
    }
    
    points.push({ latitude: end.latitude, longitude: end.longitude });
    setRoute(points);
  };


  useEffect(() => {
    if (route.length >= 2 && !success && bookingDetails?.return_status === 'in_return') {
      latestIndexRef.current = 0;
      
      
      if (route[0]) {
        animatedLatitude.setValue(route[0].latitude);
        animatedLongitude.setValue(route[0].longitude);
      }
      
      animateStep(0);
    }
  }, [route, success, bookingDetails?.return_status]);

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
    if (!dateString) return '';
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const logo = { uri: "https://cdn-icons-png.flaticon.com/512/854/854866.png" };


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#FFA001" />
        <Text className="text-white mt-2">Loading return details...</Text>
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

  // Show waiting message if return_status is 'pending'
  if (bookingDetails?.return_status === 'pending') {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Ionicons name="time-outline" size={80} color="#FFA001" />
        <Text className="text-white text-xl text-center mt-4 mb-2">Waiting for Owner to Accept Return</Text>
        <Text className="text-white text-center mb-6">Your return request has been sent. Please wait for the owner to accept the return.</Text>
        
        <View className="w-full bg-gray-800 h-2 rounded-full mb-5">
          <View className="bg-blue-500 h-2 rounded-full w-1/3"></View>
        </View>
        
        <Text className="text-white mb-6">Status: Waiting for owner acceptance</Text>
        
        <CustomButton 
          title="Refresh Status" 
          handlePress={() => {
            setApiCallAttempted(false); 
            setLoading(true);
            axios.get(`${API_URL}/api/bookings/delivery-details/${bookingId}/`, 
              { headers: { Authorization: `Bearer ${token}` } })
              .then(res => setBookingDetails(res.data))
              .catch(err => {
                console.error("Error refreshing status:", err);
                setError("Failed to refresh status.");
              })
              .finally(() => setLoading(false));
          }} 
          containerStyles="mt-4" 
        />
        <CustomButton 
          title="Go Back to Home" 
          handlePress={() => router.replace("/home")} 
          containerStyles="mt-2" 
        />
      </View>
    );
  }


  if (bookingDetails?.return_status !== 'in_return') {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Text className="text-white text-xl text-center">Return Not In Progress</Text>
        <Text className="text-white text-center mt-2">The return process has not started yet.</Text>
        <CustomButton title="Go Back to Home" handlePress={() => router.replace("/home")} containerStyles="mt-4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center mt-8 px-4">
          <MapView
            style={{ width: "100%", height: 300, borderRadius: 20 }}
            region={{
              
              latitude: userLocation ? 
                (userLocation.latitude + (origin?.latitude || 0)) / 2 : 
                (origin?.latitude || 25.0700),
              longitude: userLocation ? 
                (userLocation.longitude + (origin?.longitude || 0)) / 2 : 
                (origin?.longitude || 67.2840),
              latitudeDelta: 0.1, 
              longitudeDelta: 0.1,
            }}
          >
            {origin && <Marker coordinate={origin} title="Owner Location" pinColor="green" />}
            {userLocation && <Marker coordinate={userLocation} title="Your Location" pinColor="red" />}
            
            {route.length >= 2 && (
              <>
                <Marker.Animated coordinate={animatedCoordinate} title="Rider">
                  <Image source={logo} style={{ width: 40, height: 40 }} />
                </Marker.Animated>
                <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
              </>
            )}
          </MapView>

          <View className="bg-blue-900 w-full p-3 rounded-lg mt-3">
            <Text className="text-white text-center font-bold">
              Status: Return in progress - Item being returned to owner
            </Text>
          </View>

          {/* Ride Details */}
          <View className="mt-4 flex flex-row items-center justify-center bg-black-100 rounded-lg shadow-sm mb-3 border border-white border-0.5">
            <View className="flex flex-col items-start justify-center p-3">
              <View className="flex flex-row items-center justify-between">
                <Image source={Rlogo} className="w-[80px] h-[90px] rounded-lg" />
                <View className="flex flex-col mx-5 gap-y-5 flex-1">
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      From: {bookingDetails?.destination_address || "Your Location"}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      To: {bookingDetails?.origin_address || "Owner's Location"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-col w-full mt-5 bg-black-100 rounded-lg p-3 items-start justify-center">
                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Date & Time</Text>
                  <Text className="text-md font-JakartaBold text-white" numberOfLines={1}>
                    {formatDate(bookingDetails?.end_date || new Date())}, {formatTime(bookingDetails?.end_date || new Date())}
                  </Text>
                </View>
                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Owner</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {bookingDetails?.rentee_name || "Owner"}
                  </Text>
                </View>
                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Product</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {bookingDetails?.item_title || "Product"}
                  </Text>
                </View>
                <View className="flex flex-row items-center w-full justify-between">
                  <Text className="text-md font-JakartaMedium text-white">Return Status</Text>
                  <Text className="text-md capitalize font-JakartaBold text-green-500">
                    {bookingDetails?.return_status || "In Return"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <CustomButton
            title="Proceed"
            disabled={!itemReceived}
            containerStyles={`mt-2 w-full ${itemReceived ? "bg-orange-500" : "bg-orange-300"}`}
            handlePress={() => {
              if (itemReceived && bookingDetails?.booking_id) {
                router.push({
                  pathname: "/SecondInspectionReport",
                  params: { bookingId: bookingDetails.booking_id }
                });
              } else if (itemReceived && bookingId) {
                router.push({
                  pathname: "/SecondInspectionReport",
                  params: { bookingId: bookingId }
                });
              } else {
                Alert.alert("Error", "Cannot proceed without booking information");
              }
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
              Return Complete!
            </Text>
            <Text className="text-md text-gray-500 text-center mt-3">
              Your item has been successfully returned to the owner.
            </Text>
            <CustomButton
              title="Confirm Return Complete"
              containerStyles="mt-5 w-full bg-orange-500"
              handlePress={async () => {
                try {
                  // Comment out API call as requested
                  // await axios.patch(
                  //   `${API_URL}/api/bookings/update-delivery-status/${bookingId}/`,
                  //   { status: "delivered" },
                  //   { headers: { Authorization: `Bearer ${token}` } }
                  // );
                  
                  setSuccess(false);
                  setItemReceived(true);
                  Alert.alert("Success", "Return has been completed successfully!");
                } catch (error) {
                  console.error("Error completing return:", error);
                  Alert.alert("Error", "Failed to complete return process.");
                  setSuccess(false);
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ReturnMapsScreen;
