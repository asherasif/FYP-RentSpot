import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
  } from "react-native";
  import React, { useState, useEffect, useContext } from "react";
  import { useLocalSearchParams, useRouter } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import axios from "axios";
  import { API_URL } from "@env";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { AuthContext } from "../../context/AuthContext";
  import { ChevronLeft, Plus } from 'lucide-react-native';
  
  import ProductCard from '../../components/ProductCard';
  import EmptyState from '../../components/EmptyState';
  
  const CategoryPage = () => {
    const { categoryName } = useLocalSearchParams();
    const router = useRouter();
    const { token } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
  
    const fetchCategoryItems = async () => {
      if (!token) {
        console.warn("No token available!");
        return;
      }
  
      try {
        const response = await axios.get(`${API_URL}/api/items/getallitems/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response?.data) {

          const filteredItems = response.data.filter(
            (item) => item.category && item.category.includes(categoryName)
          );
          setItems(filteredItems);
        }
      } catch (error) {
        console.error("Error fetching category items:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchCategoryItems();
    }, [categoryName, token]);
  
    const onRefresh = async () => {
      setRefreshing(true);
      await fetchCategoryItems();
      setRefreshing(false);
    };

    const navigateToUpload = () => {
      router.push("/upload");
    };
  
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-row items-center p-4 border-b border-black-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-psemibold text-white flex-1">{categoryName}</Text>
        </View>
  
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) =>
              item.productID
                ? item.productID.toString()
                : item.id?.toString() || item.title?.toString() || Math.random().toString()
            }
            renderItem={({ item }) => (
              <View style={{ flex: 1 / 2, padding: 10 }}>
                <ProductCard product={item} />
              </View>
            )}
            numColumns={2}
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingTop: 10,
            }}
            columnWrapperStyle={{
              justifyContent: 'space-between',
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-10">
                <EmptyState title={`No items found in ${categoryName}`} />
                <TouchableOpacity 
                  onPress={navigateToUpload}
                  className="flex-row items-center bg-secondary px-4 py-2 mt-4 rounded-md"
                >
                  <Plus color="white" size={18} />
                  <Text className="text-white font-psemibold ml-2">Add {categoryName} Item</Text>
                </TouchableOpacity>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      color: "#FF6B6B",
      fontSize: 16,
      textAlign: "center",
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1E1E2D",
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 130,
      marginBottom: 11,
      elevation: 1,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: "#2a2a3a",
    },
    content: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    price: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#00BFFF",
      marginTop: 4,
    },
    category: {
      color: "#cccccc",
      marginTop: 4,
    },
    bottomRow: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    viewButton: {
      backgroundColor: "#005fff",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    buttonText: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    emptyText: {
      textAlign: "center",
      color: "#ffffff",
      marginTop: 40,
      fontSize: 16,
    },
  });
  
  export default CategoryPage;
  