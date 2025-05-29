import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { API_URL } from "@env";
import { AuthContext } from "../context/AuthContext";

import icon1 from "../assets/icons/search.png";
import ProductCard from "../components/ProductCard"; 

const Search = () => {
  const { token } = useContext(AuthContext); 
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [debouncedQuery, setDebouncedQuery] = useState(""); 

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250); 

    return () => {
      clearTimeout(handler); 
    };
  }, [query]);

  
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get(
          `${API_URL}/api/items/search?q=${debouncedQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, 
            },
          }
        );

        if (response.data.search_results) {
         
          const processedResults = response.data.search_results.map((item) => ({
            ...item,
            image: item.image ? `${API_URL}/${item.image}`.replace(/\/\/+/g, "/") : null,
          }));

          setResults(processedResults);
        }
      } catch (error) {
        console.error("Error fetching search results:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const renderResultItem = ({ item }) => (
    <View className="p-4 bg-black-200 mb-2 rounded-lg">
      <ProductCard product={item} /> 
    </View>
  );

  return (
    <View className="py-3">

      <View className="w-full h-16 bg-black-200 rounded-xl flex-row items-center px-4">
        <TextInput
          className="flex-1 text-white font-pregular"
          style={{ opacity: 0.9 }}
          placeholder="Search for an Item"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={query}
          onChangeText={setQuery}
        />
        <Image source={icon1} className="w-5 h-5 ml-2" resizeMode="contain" />
      </View>

      
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderResultItem}
          contentContainerStyle={{ marginTop: 20 }}
        />
      )}

   
      {!loading && query.trim().length > 0 && results.length === 0 && (
        <Text className="text-white mt-4 text-center">
          No results found.
        </Text>
      )}
    </View>
  );
};

export default Search;