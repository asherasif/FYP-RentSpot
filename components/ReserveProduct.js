import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Alert,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Button,
} from "react-native";
import { CardField } from "@stripe/stripe-react-native";
import DateRangePicker from "rn-select-date-range";
import moment from "moment";

const color = {
  background: "#f5f5f5",
  primary: "#475FCB",
  secondary: "#6E7AFA",
};

const ReserveProduct = ({ route, navigation }) => {

  const product = {
    productID: "1",
    title: "Modern Living Room Furniture",
    displayPrice: 2000,
    imageids: ["https://dummyimage.com/640x360/fff/aaa"],
  };
  const userEmail = "example@example.com";

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRange, setRange] = useState({});
  const [cardDetails, setCardDetails] = useState();

  const handleConfirmPayment = () => {
    if (!selectedRange.secondDate || !cardDetails || !selectedRange.firstDate) {
      return Alert.alert("Empty fields", "Please fill all fields.");
    }
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Product Reserved Successfully");
      navigation.navigate("Home");
    }, 2000);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ backgroundColor: color.background, flex: 1 }}>
        <ScrollView style={{ paddingHorizontal: 10 }}>
          <Image
            style={{
              width: "100%",
              borderRadius: 10,
              height: 130,
              backgroundColor: "white",
            }}
            resizeMode="center"
            source={{
              uri: product.imageids[0],
            }}
          />
          <Text style={{ fontSize: 22, marginTop: 10, fontWeight: "bold" }}>
            {product.title.length > 30
              ? product.title.slice(0, 30) + "..."
              : product.title}
          </Text>
          <Text style={{ color: color.primary, fontSize: 18, marginTop: 7 }}>
            PKR {product.displayPrice}
            <Text
              style={{
                fontSize: 15,
                color: "black",
                fontStyle: "italic",
              }}
            >
              /day
            </Text>
          </Text>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 10, fontWeight: "500" }}>
              Select Dates
            </Text>
            <DateRangePicker
              onSelectDateRange={(range) => {
                setRange(range);
              }}
              blockSingleDateSelection={true}
              responseFormat="YYYY-MM-DD"
              maxDate={moment(new Date()).add(3, "M")}
              minDate={moment(new Date())}
              selectedDateContainerStyle={{
                height: 30,
                width: "130%",
                borderRadius: 5,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: color.secondary,
              }}
              selectedDateStyle={{ fontWeight: "bold", color: "white" }}
            />
          </View>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 10, fontWeight: "500" }}>
              Price details
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 17, marginBottom: 5 }}>Total days</Text>
              {selectedRange.secondDate ? (
                <Text style={{ fontSize: 17, marginBottom: 5 }}>
                  {moment(selectedRange.secondDate).diff(
                    selectedRange.firstDate,
                    "days"
                  )}
                </Text>
              ) : (
                <Text style={{ fontSize: 16, marginBottom: 5, color: "red", fontStyle: "italic" }}>
                  Please select dates
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 18, marginBottom: 5 }}>Price per day</Text>
              <Text style={{ fontSize: 18, marginBottom: 5 }}>{product.displayPrice}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 17, marginBottom: 5 }}>Service fee</Text>
              <Text style={{ fontSize: 17, marginBottom: 5 }}>
                {Math.floor(product.displayPrice * 0.1)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 18, fontStyle: "italic", fontWeight: "bold" }}>Total</Text>
              <Text style={{ fontSize: 18, fontStyle: "italic", fontWeight: "bold" }}>
                PKR{" "}
                {selectedRange.secondDate
                  ? Math.floor(
                      product.displayPrice * 0.1 +
                        product.displayPrice *
                          moment(selectedRange.secondDate).diff(
                            selectedRange.firstDate,
                            "days"
                          )
                    )
                  : Math.floor(product.displayPrice * 0.1 + product.displayPrice)}
              </Text>
            </View>
          </View>
          <TextInput
            style={{
              height: 45,
              width: "100%",
              marginBottom: 10,
              backgroundColor: "white",
              borderRadius: 10,
              fontSize: 16,
              padding: 10,
            }}
            placeholder="Email Address"
            keyboardType="email-address"
            value={userEmail}
            editable={false}
            autoCapitalize="none"
          />
          <CardField
            postalCodeEnabled={false}
            style={{
              width: "100%",
              borderRadius: 10,
              height: 50,
              marginBottom: 20,
            }}
            cardStyle={{
              textColor: "#1c1c1c",
            }}
            onCardChange={(cardDetails) => {
              setCardDetails(cardDetails);
            }}
          />
          <Button
            title="Confirm and Pay"
            color={color.primary}
            onPress={handleConfirmPayment}
            disabled={isLoading}
          />
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ReserveProduct;
