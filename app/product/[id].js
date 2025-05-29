import React, { useEffect, useState, useContext } from "react";
import {
  View,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  Text,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Fontisto from "react-native-vector-icons/Fontisto";
import moment from "moment";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import Review from "../../components/Reviews";
import axios from "axios";
import { API_URL } from "@env";
import {AuthContext} from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const ProductDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [isSaved, setIsSaved] = useState(false);
  const [aiScore, setAiScore] = useState(null); 

  const auth= useContext(AuthContext);
  console.log("Auth context:", auth);
  const { token } = useContext(AuthContext);


  const getLocationCoordinates = (locationString) => {
    if (!locationString) return { latitude: 0, longitude: 0 };
    const [latitude, longitude] = locationString
      .split(",")
      .map((coord) => parseFloat(coord));
    return { latitude, longitude };
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!token) {
        console.warn("Token is missing, skipping fetch");
        const localToken = await AsyncStorage.getItem("accessToken");
        if (localToken) {
          setToken(localToken);
        } else {
          Alert.alert("Error", "User not authenticated");
          return;
        }
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_URL}/api/items/get/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProduct(response.data);
        setDisplayPrice(response.data.price); 

        const scoreResponse = await axios.get(
          `${API_URL}/api/reviews/getoverallscore/${id}/?score=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAiScore(scoreResponse.data.overall_score);
        
        // Check if the item is saved
        const savedResponse = await axios.get(
          `${API_URL}/api/items/saved-items/check/?item=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsSaved(savedResponse.data.is_saved);
      } catch (error) {
        const errorMessage = error?.message || "Failed to load product details";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id, token]);

  const calculatePrice = (period) => {
    if (!product) return 0;
    const basePrice = product.price;
    const discounts = {
      day: 1,
      week: 0.85,
      month: 0.7,
    };
    return Math.round(basePrice * discounts[period]);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setDisplayPrice(calculatePrice(period));
  };

  const handleSaveProduct = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/items/saved-items/toggle/`,
        { item: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsSaved(response.data.saved);
      Alert.alert(
        "Success",
        response.data.message
      );
    } catch (error) {
      console.error("Error toggling saved status:", error);
      Alert.alert("Error", "Failed to update saved status");
    }
  };

  const handleReserveProduct = () => {
    if (!product) return;

    router.push({
      pathname: "/ReserveProduct",
      params: {
        productId: product.id,
        period: selectedPeriod,
        price: displayPrice,
        rentee: product.rentee,
      },
    });
  };

  const renderImageItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image
        style={styles.productImage}
        source={{ uri: item }}
        resizeMode="contain"
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Product not found"}</Text>
        <Button title="Retry" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // Get coordinates for the map
  const coordinates = getLocationCoordinates(product.location);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageGallery}>
          <FlatList
            data={[product.image]} 
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            horizontal
            renderItem={renderImageItem}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text style={styles.title}>{product.title}</Text>
              <TouchableOpacity
                onPress={handleSaveProduct}
                style={{ marginLeft: 10 }}
              >
                <Fontisto
                  name={isSaved ? "heart" : "heart-alt"}
                  size={22}
                  color={isSaved ? "#FF6B81" : "#ffffff"}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: "#475FCB",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
              onPress={() =>
                router.push({
                  pathname: "/ProductReview",
                  params: { productId: id },
                })
              }
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Give Review
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>
              {product.category} • {product.sub_category}
            </Text>
          </View>

          <View style={styles.dateContainer}>
            <Fontisto name="date" size={14} color="white" />
            <Text style={styles.dateText}>
              {moment(product.created_at).format("MMMM D, YYYY")}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>AI Rating - </Text>
            <View
              style={{
                backgroundColor: "#000",
                paddingVertical: 3,
                paddingHorizontal: 7,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white", fontSize: 22 }}>
                {aiScore !== null ? `★ ${aiScore}` : "Loading..."}
              </Text>
            </View>
          </View>

          <View>
            <MapView
              style={styles.map}
              region={{
                ...coordinates,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.00421,
              }}
            >
              <Marker coordinate={coordinates} title={product.title} />
            </MapView>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Rating and Reviews</Text>

            <Review id={id} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.priceText}>
          PKR {displayPrice}/{selectedPeriod}
        </Text>
        <View style={styles.buttonContainer}>
          {["day", "week", "month"].map((period) => (
            <Button
              key={period}
              title={period.charAt(0).toUpperCase() + period.slice(1)}
              onPress={() => handlePeriodChange(period)}
              color={selectedPeriod === period ? "#475FCB" : undefined}
            />
          ))}
          <Button
            title="Reserve"
            onPress={handleReserveProduct}
            color="#475FCB"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  categoryText: {
    color: "#ffffff",
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: "#161622",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 16,
    marginBottom: 20,
  },
  imageGallery: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "90%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    marginVertical: 2,
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "white",
    marginLeft: 8,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 7,
  },
  description: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
    marginBottom: 10,
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  bottomBar: {
    backgroundColor: "#1E1E2D",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  priceText: {
    fontSize: 22,
    color: "#475FCB",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default ProductDetails;
