import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import logo from "../assets/images/RLogo.png";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { API_URL } from "@env";
import {AuthContext} from "./../context/AuthContext";

const MySavedProducts = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [savedItems, setSavedItems] = useState([]);
  const [error, setError] = useState(null);
  
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    if (!token) {
      console.warn("Token is missing, skipping fetch");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/api/items/saved-items/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Saved items response:", JSON.stringify(response.data));

      if (response.data && response.data.length > 0) {
        response.data.forEach((savedItem, index) => {
          console.log(`Saved item ${index}:`, {
            savedItemId: savedItem.id,
            itemId: savedItem.item,
            itemDetailsId: savedItem.item_details?.id,
            title: savedItem.item_details?.title
          });
        });
      }
      
      setSavedItems(response.data);
    } catch (error) {
      console.error("Error fetching saved items:", error.response ? error.response.data : error.message);
      setError("Failed to load saved items");
      Alert.alert("Error", "Failed to load saved items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSaved = async (itemId) => {
    try {
      console.log(`Attempting to remove item ID: ${itemId}`);
      
      await axios.post(
        `${API_URL}/api/items/saved-items/toggle/`,
        { item: itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      
      setSavedItems(savedItems.filter(savedItem => savedItem.item_details.id !== itemId));
      Alert.alert("Success", "Item removed from saved items");
      

      fetchSavedItems();
    } catch (error) {
      console.error("Error removing item:", error.response ? error.response.data : error.message);
      Alert.alert("Error", error.response?.data?.error || "Failed to remove item");
    }
  };

  const handleViewItem = (itemId) => {
    router.push(`/product/${itemId}`);
  };

  const Card = ({ savedItem }) => {
    const item = savedItem.item_details;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleViewItem(item.id)}
      >
        <Image 
          source={item.image ? { uri: `${API_URL}${item.image}` } : logo} 
          resizeMode="contain" 
          style={styles.image} 
        />
        <View style={styles.content}>
          <Text style={styles.title}>{item.title.slice(0, 25)}{item.title.length > 25 && "..."}</Text>
          <Text style={styles.time}>{moment(savedItem.saved_at).format("MMMM Do YYYY")}</Text>
          <Text style={styles.price}>PKR {item.price}</Text>
  
          <View style={styles.bottomRow}>
            <View style={[styles.categoryTag, styles.sportsCategory]}>
              <Text style={styles.statusText}>{item.category}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => {
                console.log(`Remove button pressed for item: ${item.id}`);
                handleRemoveSaved(item.id);
              }}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Products</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView>
          {savedItems.length > 0 ? (
            savedItems.map((item) => (
              <Card 
                key={`saved_${item.id}`} 
                savedItem={item} 
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved items found</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => router.push('/home')}
              >
                <Text style={styles.browseButtonText}>Browse Products</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#475FCB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
    color: "#FFFFFF"
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#FFFFFF"
  },
  categoryTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: "#FFFFFF"
  },
  sportsCategory: {
    backgroundColor: "#005fff", // Navy blue
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
  removeButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  removeButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default MySavedProducts;
