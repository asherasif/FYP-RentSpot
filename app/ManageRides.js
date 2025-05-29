// app/ManageRides.js

import { View, Text, Pressable, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useContext, useCallback } from "react";
import {AuthContext} from "./../context/AuthContext";
import axios from "axios";
import { API_URL } from "@env";

const ManageRides = () => {
  const router = useRouter();
  const { token } = useContext(AuthContext);
  const [selectedTab, setSelectedTab] = useState("dispatch");
  const [dispatchRides, setDispatchRides] = useState([]);
  const [returnRides, setReturnRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDispatchRides = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }
    if (selectedTab !== 'dispatch') return;

    console.log("Fetching dispatch rides...");
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/api/bookings/pending-deliveries/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log("Pending dispatch deliveries fetched:", response.data);
      
      // Include all rides that have delivery_status as 'in_delivery' or 'pending'
      // regardless of return status
      const dispatchRidesData = (response.data || []).filter(
        ride => ride.delivery_status === 'in_delivery' || ride.delivery_status === 'pending'
      );
      
      console.log("Filtered dispatch rides:", dispatchRidesData.length);
      setDispatchRides(dispatchRidesData);
    } catch (error) {
      console.error("Error fetching dispatch rides:", error);
      console.error("Error details:", error.response?.status, error.response?.data);
      let errorMessage = "Failed to load dispatch requests. ";
      if (error.response?.status === 403) {
        errorMessage += "Authorization issue. ";
      } else if (error.response?.status === 401) {
        errorMessage += "Your session has expired. Please login again.";
      } else {
        errorMessage += "Please try again or contact support.";
      }
      setError(errorMessage);
      setDispatchRides([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedTab]);

  const fetchReturnRides = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }
    if (selectedTab !== 'return') return;

    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/api/bookings/pending-deliveries/`,
        { headers }
      );
      
      // Filter for return rides: return_status === 'pending' or 'in_return'
      const returnRidesData = (response.data || []).filter(
        ride => ride.return_status === 'pending' || ride.return_status === 'in_return'
      );
      
      console.log("Filtered return rides:", returnRidesData.length);
      setReturnRides(returnRidesData);
      setError(null);
    } catch (error) {
      console.error("Error fetching return rides:", error);
      setReturnRides([]);
      setError("Failed to load return requests.");
    }
    setLoading(false);
  }, [token, selectedTab]);

  useEffect(() => {
    if (selectedTab === 'dispatch') {
      fetchDispatchRides();
    } else if (selectedTab === 'return') {
      fetchReturnRides();
    }
  }, [selectedTab, fetchDispatchRides, fetchReturnRides]);

  const handleApproveRide = async (bookingId) => {
    try {
      setLoading(true);
      await axios.patch(
        `${API_URL}/api/bookings/update-delivery-status/${bookingId}/`,
        { status: "in_delivery" },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      router.push(`/RiderscreenVendor?bookingId=${bookingId}&isReturn=false`);
    } catch (error) {
      console.error("Error approving delivery:", error);
      Alert.alert(
        "Error",
        "Failed to approve delivery request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = async (bookingId) => {
    if (!token || !bookingId) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/bookings/accept-return/${bookingId}/`,
        {},
        { headers }
      );
      fetchReturnRides();
      Alert.alert("Success", "Return request accepted. Return delivery in progress.");
      router.push(`/ReturnMapsScreen?bookingId=${bookingId}&isReturn=true`);
    } catch (error) {
      console.error("Error accepting return:", error);
      Alert.alert("Error", "Failed to accept return request.");
    }
    setLoading(false);
  };

  const getCurrentRides = () => {
    return selectedTab === 'dispatch' ? dispatchRides : returnRides;
  };

  const getEmptyMessage = () => {
    return selectedTab === 'dispatch'
      ? "No pending dispatch requests"
      : "No pending return requests";
  };

  const getLoadingMessage = () => {
    return selectedTab === 'dispatch'
      ? "Loading dispatch requests..."
      : "Loading return requests...";
  };

  const handleRefresh = () => {
    if (selectedTab === 'dispatch') {
      fetchDispatchRides();
    } else {
      fetchReturnRides();
    }
  };

  return (
    <View className="flex-1 bg-primary pt-12 px-4">
      <View className="flex-row items-center mb-4" style={styles.headerBar}>
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-lg text-white font-semibold">Manage Rides</Text>
        <Pressable onPress={handleRefresh} className="ml-auto">
          <Ionicons name="refresh" size={24} color="white" />
        </Pressable>
      </View>

      <View className="flex-row justify-around mb-4 border-b border-gray-600">
        <TouchableOpacity
          onPress={() => setSelectedTab("dispatch")}
          className={`py-2 px-4 ${
            selectedTab === "dispatch" ? "border-b-2 border-secondary" : ""
          }`}
        >
          <Text className={`text-lg font-semibold ${selectedTab === 'dispatch' ? 'text-secondary' : 'text-gray-400'}`}>
            Dispatch Rides
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("return")}
          className={`py-2 px-4 ${
            selectedTab === "return" ? "border-b-2 border-secondary" : ""
          }`}
        >
          <Text className={`text-lg font-semibold ${selectedTab === 'return' ? 'text-secondary' : 'text-gray-400'}`}>
            Return Rides
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View className="items-center justify-center py-4">
          <ActivityIndicator size="large" color="#FFA001" />
          <Text className="text-white mt-2">{getLoadingMessage()}</Text>
        </View>
      )}

      {error && !loading && (
        <View className="bg-red-900 p-4 rounded-lg mb-4">
          <Text className="text-white">{error}</Text>
          <TouchableOpacity
            className="mt-2 bg-red-700 px-3 py-1 rounded"
            onPress={handleRefresh}
          >
            <Text className="text-white text-center">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && getCurrentRides().length === 0 && (
        <View className="items-center justify-center py-10 flex-1">
          <Ionicons name="document-outline" size={48} color="gray" />
          <Text className="text-gray-400 text-lg mt-4">{getEmptyMessage()}</Text>
          <TouchableOpacity
            className="mt-4 bg-secondary px-4 py-2 rounded-lg"
            onPress={handleRefresh}
          >
            <Text className="text-primary font-semibold">Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && getCurrentRides().length > 0 && (
        <ScrollView style={{borderRadius: 10}} showsVerticalScrollIndicator={false} className="flex-1 bg-primary">
          {getCurrentRides().map((ride) => (
            <View
              key={`${selectedTab}-${ride.id || ride.booking_id}`}
              className="bg-black-100 p-4 mb-3 rounded-2xl shadow-sm space-y-2"
            >
              <Text className="font-semibold text-base text-white">{ride.rider_name || ride.rentee_name || "Customer"}</Text>
              <Text className="text-sm text-white">
                Item: {ride.item_name || ride.item_title || "Rental Item"}
              </Text>
              <Text className="text-sm text-white">
                {selectedTab === 'dispatch' ? 'Pickup: ' : 'Return From: '} {ride.pickup_location || ride.origin_address || "Item Location"}
              </Text>
              <Text className="text-sm text-white">
                {selectedTab === 'dispatch' ? 'Dropoff: ' : 'Return To: '} {ride.dropoff_location || ride.destination_address || "Customer Location"}
              </Text>
              <Text className="text-sm text-white">Time: {ride.request_time || new Date(ride.booking_created_at || Date.now()).toLocaleTimeString()}</Text>
              {selectedTab === 'dispatch' && (
                <Text className="text-sm text-white">Status: {ride.payment_status || "Paid"}</Text>
              )}
              {selectedTab === 'return' && (
                <Text className="text-sm text-white">Return Status: {ride.return_status || "Pending"}</Text>
              )}

              <View className="flex-row space-x-4 pt-2">
                {selectedTab === 'dispatch' && (
                  <TouchableOpacity
                    className={`bg-green-500 flex-1 py-2 rounded-xl ${
                      ride.delivery_status === 'in_delivery' || ride.delivery_status === 'delivered' 
                        ? 'opacity-50' 
                        : ''
                    }`}
                    onPress={() => 
                      (ride.delivery_status !== 'in_delivery' && ride.delivery_status !== 'delivered') && 
                      handleApproveRide(ride.id || ride.booking_id)
                    }
                    disabled={ride.delivery_status === 'in_delivery' || ride.delivery_status === 'delivered'}
                  >
                    <Text className="text-white text-center font-semibold">
                      {ride.delivery_status === 'in_delivery' || ride.delivery_status === 'delivered' 
                        ? 'Already Dispatched' 
                        : 'Approve Dispatch'}
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedTab === 'return' && (
                  <TouchableOpacity
                    className={`bg-orange-500 flex-1 py-2 rounded-xl ${ride.return_status !== 'pending' ? 'opacity-50' : ''}`}
                    onPress={() => ride.return_status === 'pending' && handleApproveReturn(ride.id || ride.booking_id)}
                    disabled={ride.return_status !== 'pending'}
                  >
                    <Text className="text-white text-center font-semibold">
                      Approve Return
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default ManageRides;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 15,
    paddingHorizontal: 5,
  },
});
