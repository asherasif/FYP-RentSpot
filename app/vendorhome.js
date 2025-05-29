import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import React, { useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import logo from "../assets/images/RLogo.png";
import { Bell } from "lucide-react-native";
import {AuthContext} from "./../context/AuthContext";

const VendorHome = () => {
  const { user, logout } = useContext(AuthContext);
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes, Logout",
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6 space-y-6">
       
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="font-pmedium text-sm text-gray-100">Welcome Vendor!</Text>
              <Text
                className="text-2xl font-psemibold text-white"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.username || "Vendor"}
              </Text>
            </View>


            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              className="ml-2 mt-3"
            >
              <Bell color="white" size={24} />
            </TouchableOpacity>

        
            <Image
              source={logo}
              className="h-[55px]"
              style={{ width: 90 }}
              resizeMode="contain"
            />
          </View>

    
          <View className="space-y-4">
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-5 items-center"
              onPress={() => router.push("/ManageRides")}
            >
              <Text className="text-white font-pbold text-lg">Manage Ride Requests</Text>
            </TouchableOpacity>

            {/* Commented out Ride History button
            <TouchableOpacity
              className="bg-green-500 rounded-xl p-5 items-center"
              onPress={() => router.push("/RideHistory")}
            >
              <Text className="text-white font-pbold text-lg">Ride History</Text>
            </TouchableOpacity>
            */}

            <TouchableOpacity
              className="bg-yellow-500 rounded-xl p-5 items-center"
              onPress={handleLogout}
            >
              <Text className="text-black font-pbold text-lg">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorHome;
