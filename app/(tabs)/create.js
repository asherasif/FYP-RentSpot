import { useState, useContext } from "react";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Location from 'expo-location';
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Alert, Image, TouchableOpacity, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios"; 
import { API_URL } from '@env';
import { icons } from "../../constants";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import { AuthContext } from "../../context/AuthContext";


const categories = [
  {
    name: "Home and Kitchen Appliances",
    icon: "🍳",
    subcategories: [
      { name: "Small Appliances", icon: "🍞" },
      { name: "Large Appliances", icon: "🏠" },
      { name: "Kitchen Gadgets", icon: "🔪" },
    ],
  },
  {
    name: "Furniture",
    icon: "🪑",
    subcategories: [
      { name: "Living Room", icon: "🛋️" },
      { name: "Dining Room", icon: "🍽️" },
      { name: "Bedroom", icon: "🛏️" },
      { name: "Office Furniture", icon: "💼" },
    ],
  },
  {
    name: "Electronics and Gadgets",
    icon: "📱",
    subcategories: [
      { name: "Tech Equipment", icon: "🔌" },
      { name: "Computing Devices", icon: "💻" },
      { name: "Audio Visual", icon: "🎧" },
    ],
  },
  {
    name: "Outdoor and Sports Equipment",
    icon: "🏕️",
    subcategories: [
      { name: "Camping Gear", icon: "⛺" },
      { name: "Sports Equipment", icon: "🏀" },
      { name: "Fitness Equipment", icon: "🏋️" },
    ],
  },
  {
    name: "Event and Party Supplies",
    icon: "🎉",
    subcategories: [
      { name: "Event Equipment", icon: "🎤" },
      { name: "Tableware", icon: "🍴" },
      { name: "Decor", icon: "🌸" },
    ],
  },
  {
    name: "Baby and Kids Items",
    icon: "🍼",
    subcategories: [{ name: "Baby Gear", icon: "🛁" }],
  },
  {
    name: "Tools and Equipment",
    icon: "🔧",
    subcategories: [
      { name: "Home Improvement", icon: "🛠️" },
      { name: "Workshop Gear", icon: "🗜️" },
    ],
  },
  {
    name: "Vehicles",
    icon: "🚗",
    subcategories: [{ name: "Transport", icon: "🚚" }],
  },
  {
    name: "Health and Wellness",
    icon: "💊",
    subcategories: [
      { name: "Medicine", icon: "🩺" },
      { name: "Wellness Devices", icon: "🛁" },
    ],
  },
  {
    name: "Educational Resources",
    icon: "📚",
    subcategories: [
      { name: "Books", icon: "📖" },
      { name: "Learning Tools", icon: "🖊️" },
    ],
  },
  {
    name: "Office Equipment",
    icon: "📂",
    subcategories: [{ name: "Meeting Supplies", icon: "🖨️" }],
  },
  {
    name: "Decor and Seasonal Items",
    icon: "🎨",
    subcategories: [
      { name: "Home Decor", icon: "🏡" },
      { name: "Seasonal Decorations", icon: "🎄" },
    ],
  },
];

const CreateItem = () => {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    address: "",    
    location: "",   
    category: "",
    sub_category: "",
    image: null,
    description: "",
  });

  const [subcategories, setSubcategories] = useState([]);
  const { token } = useContext(AuthContext);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to auto-fill coordinates.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coordinates = `${location.coords.latitude},${location.coords.longitude}`;
      setForm(prev => ({
        ...prev,
        location: coordinates
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
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
  

  const handleCategoryChange = (selectedCategory) => {
    const selectedData = categories.find(
      (item) => item.name === selectedCategory
    );
    setForm({
      ...form,
      category: selectedCategory,
      sub_category: "",
    });
    setSubcategories(selectedData ? selectedData.subcategories : []);
  };

  const submit = async () => {
    if (
      !form.title ||
      !form.price ||
      !form.address ||
      !form.location ||
      !form.category ||
      !form.sub_category ||
      !form.description ||
      !form.image
    ) {
      Alert.alert("Error", "All fields are required, including address, location coordinates, and an image.");
      return;
    }
  
    setUploading(true);
  
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", parseInt(form.price, 10));
      formData.append("address", form.address);
      formData.append("location", form.location);
      formData.append("category", form.category);
      formData.append("sub_category", form.sub_category);
      formData.append("description", form.description);
  
      const { uri, name, type } = form.image;
  
      formData.append("image", {
        uri: uri.startsWith("file://") ? uri : `file://${uri}`,
        name: name || "image.jpg",
        type: type || "image/jpeg",
      });
  
      const response = await axios.post(`${API_URL}/api/items/create/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.status === 201) {
        Alert.alert("Success", "Ad created successfully!");
        router.push("/home");
      } else {
        throw new Error("Something went wrong while creating the ad.");
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      Alert.alert("Error", error.message || "Failed to create ad.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
    
        <Text className="text-2xl text-white font-psemibold">Upload Ad</Text>

        <FormField
          title="Ad Title"
          value={form.title}
          placeholder="Give your ad a catchy title..."
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyles="mt-10 mb-5"
        />

        <FormField
          title="Price"
          value={form.price}
          placeholder="Enter the price..."
          handleChangeText={(e) => setForm({ ...form, price: e })}
          otherStyles="mt-4 mb-3"
        />

        <FormField
          title="Address"
          value={form.address}
          placeholder="Enter detailed address..."
          handleChangeText={(e) => setForm({ ...form, address: e })}
          otherStyles="mt-4 mb-3"
        />

        <View className="mt-4 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">Location Coordinates</Text>
          <FormField
            value={form.location}
            placeholder="latitude,longitude"
            handleChangeText={(e) => setForm({ ...form, location: e })}
          />
          <CustomButton
            title="Get Current Location"
            handlePress={getCurrentLocation}
            containerStyles="bg-secondary-500 mt-2"
          />
        </View>

        {/* ... rest of the form remains the same ... */}
                {/* Category Dropdown */}
                <View className="mt-4 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">Category</Text>
          <View className="bg-black-100 border border-black-200 rounded-xl">
            <Picker
              selectedValue={form.category}
              onValueChange={(value) => handleCategoryChange(value)}
              style={{ color: "white", height: 50, marginHorizontal: 10 }}
            >
              <Picker.Item label="Select a category" value="" />
              {categories.map((item) => (
                <Picker.Item key={item.name} label={`${item.icon} ${item.name}`} value={item.name} />
              ))}
            </Picker>
          </View>
        </View>

   
        <View className="mt-4 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">Sub_category</Text>
          <View className="bg-black-100 border border-black-200 rounded-xl">
            <Picker
              selectedValue={form.sub_category}
              onValueChange={(value) => setForm({ ...form, sub_category: value })}
              enabled={!!form.category}
              style={{ color: "white", height: 50, marginHorizontal: 10 }}
            >
              <Picker.Item label="Select a sub_category" value="" />
              {subcategories.map((item) => (
                <Picker.Item key={item.name} label={`${item.icon} ${item.name}`} value={item.name} />
              ))}
            </Picker>
          </View>
        </View>

        <View className="mt-4 mb-3 space-y-2 ">
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

        <FormField
          title="Ad Description"
          value={form.description}
          placeholder="Describe your ad here..."
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyles="mt-4 mb-3"
        />

        <CustomButton
          title="Submit & Publish"
          handlePress={submit}
          containerStyles="mt-7"
          isLoading={uploading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateItem;