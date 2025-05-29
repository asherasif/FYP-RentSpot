import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import axios from "axios";
import { API_URL } from '@env';
import { AuthContext } from "../context/AuthContext";
import ProductCard from "./ProductCard"; 
import * as Animatable from 'react-native-animatable';


const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const Recommended = () => {
  const { token } = useContext(AuthContext); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    // Function to fetch recommended products
    const fetchRecommendedProducts = async () => {
      if (!token) {
        console.log("Token is not available yet. Skipping fetch.");
        return; 
      }

      setLoading(true);

      try {
        console.log("Authorization Token:", `Bearer ${token}`);

        const response = await axios.get(`${API_URL}/api/recommendations/getrecommendation/`, {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        });

        if (response.data.success) {
          // Process the image URLs
          const recommendations = response.data.recommendations.map((item) => ({
            ...item,
            image: item.image ? `${API_URL}/${item.image}`.replace(/\/\/+/g, '/') : null,
          }));

          setPosts(recommendations);
        } else {
          console.error("Failed to load recommendations:", response.data.message || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching recommended products:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

 
    if (token) {
      fetchRecommendedProducts();
    }
  }, [token]);

  const renderTrendingItem = ({ item }) => (
    <Animatable.View
      animation={activeItem === item.id ? zoomIn : zoomOut}
      style={{ width: 150 }}
    >
      <TouchableOpacity onPress={() => setActiveItem(item.id)}>
        <ProductCard product={item} />
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View className="flex-row items-center justify-center border-black-200 w-full">
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()} 
          renderItem={renderTrendingItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      )}

      {!loading && posts.length === 0 && (
        <Text style={{ color: "#FFFFFF", textAlign: "center", marginTop: 20 }}>
          No recommended products available.
        </Text>
      )}
    </View>
  );
};

export default Recommended;
