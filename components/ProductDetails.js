import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  Text,
  Button,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Fontisto from "react-native-vector-icons/Fontisto";



const { width } = Dimensions.get("window");

const ProductDetails = (product) => {
  const router = useRouter();
  console.log(product);
  const [userEmail] = useState("dummyuser@example.com");
  const [displayPrice, setDisplayPrice] = useState(100); 
  const [isSaved, setIsSaved] = useState(false);


  
  const data = product.imageIds;
  const [buttonGroup, setButtonGroup] = useState("");
  
  const handleSaveProduct = () => {
    setIsSaved(!isSaved);
    Alert.alert("Saved", isSaved ? "Product removed from saved!" : "Product saved!");
  };

  const handleReserveProduct = () => {
    Alert.alert("Reserve Product", "Reservation feature is under development.");
  };

  const renderItem = ({ item, index }) => (
    <View
      key={index}
      style={{
        width: width,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ width: "90%", height: "90%", borderRadius: 10 }}>
        <Image
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "white",
            borderRadius: 10,
          }}
          source={{ uri: item }}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E6EEF0" }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            horizontal
            renderItem={renderItem}
          />
        </View>
        <View style={{ flexDirection: "row", width, justifyContent: "center", alignItems: "center" }}>
          {data.map((_, index) => (
            <View
              key={index}
              style={{
                width: 10,
                height: 5,
                borderRadius: 5,
                backgroundColor: index === 0 ? "#475FCB" : "gray",
                marginLeft: 5,
              }}
            />
          ))}
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: "#4D5060" }}>{product.title}</Text>
            <TouchableOpacity onPress={handleSaveProduct}>
              <FontAwesome name={isSaved ? "heart" : "heart-o"} size={24} color="gray" />
            </TouchableOpacity>
          </View>
          {/* Dummy Ratings component placeholder */}
          {/* <Ratings value={product.rating} text={product.rating.toString()} total={product.totalReviews} /> */}
          <View style={{ flexDirection: "row", marginVertical: 10 }}>
            <Fontisto name="date" size={14} color="#777777" />
            <Text style={{ fontSize: 14 }}> {moment(product.timeStamp).fromNow()}</Text>
          </View>
          <Text style={{ fontSize: 18, color: "#4D5060", marginVertical: 10 }}>Description</Text>
          <Text style={{ fontSize: 14 }}>{product.description}</Text>
          <Text style={{ fontSize: 18, color: "#4D5060", marginVertical: 10 }}>Location</Text>
          {/* Uncomment MapView code if using react-native-maps */}
          {/* 
          <MapView
            style={{ height: 200, borderRadius: 10, borderColor: "black", borderWidth: 0.2 }}
            region={{
              latitude: product.latitude,
              longitude: product.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.00421,
            }}
          >
            <Marker coordinate={{ latitude: product.latitude, longitude: product.longitude }} title="Marker" />
          </MapView>
          */}
          <Text style={{ fontSize: 18, color: "#4D5060", marginVertical: 10 }}>Rating and Reviews</Text>
          {/* Dummy Reviews component placeholder */}
          {/* <Reviews id={product.productID} /> */}
          {/* Uncomment RenterProfile if needed */}
          {/* <RenterProfile email={product.email} currentUser={product.email === userEmail} /> */}
        </View>
      </ScrollView>
      <View style={{
        backgroundColor: "white",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        elevation: 10
      }}>
        <Text style={{ fontSize: 22, color: "#475FCB", marginBottom: 10 }}>
          PKR {displayPrice}/day
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button title="Day" onPress={() => setDisplayPrice(100)} color={buttonGroup === "" ? "#475FCB" : "#ccc"} />
          <Button title="Week" onPress={() => setDisplayPrice(85)} color={buttonGroup === "Week" ? "#475FCB" : "#ccc"} />
          <Button title="Month" onPress={() => setDisplayPrice(70)} color={buttonGroup === "Month" ? "#475FCB" : "#ccc"} />
          <Button title="Reserve" onPress={handleReserveProduct} color="#475FCB" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetails;