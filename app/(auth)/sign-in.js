import { StyleSheet, Text, View, ScrollView, Image, Alert } from "react-native";
import React, { useState, useContext, useEffect } from "react"; // Import useEffect
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/RLogo.png";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from '@env';
import { AuthContext } from '../../context/AuthContext'

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300); 
  const [pendingEmail, setPendingEmail] = useState("");
  
  const { login, user } = useContext(AuthContext); 


  useEffect(() => {
    const checkIfLoggedIn = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
       
        const userTypeFromStorage = await AsyncStorage.getItem("userType");
        if (userTypeFromStorage === "Vendor") {
          router.push("/vendorhome");
        } else {
          router.push("/home");
        }
      }
    };

    checkIfLoggedIn(); 
  }, []);

 
  useEffect(() => {
    if (user) {
   
      if (user.userType === "Vendor") {
        console.log("Redirecting to vendor home page");
        router.push("/vendorhome");
      } else {
        console.log("Redirecting to regular home page");
        router.push("/home");
      }
    }
  }, [user]);


  useEffect(() => {
    let interval = null;
    if (showOTPScreen && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOTPScreen, otpTimer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const submit = async () => {
    console.log("Submitting login request");
    setIsSubmitting(true);
    try {
   
      const response = await axios.post(`${API_URL}/api/users/login/`, {
        email: form.email,
        password: form.password,
      });

      console.log("Response received:", response.data);

      if (response.status === 200) {
      
        if (response.data.user_type) {
          await AsyncStorage.setItem("userType", response.data.user_type);
        }
        
     
        await login(response.data); 

    
        Alert.alert("Success", "Login successful!");
        
       
      } else {
        Alert.alert("Error", "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.log("Error received:", error); 
      

      if (error.response && error.response.status === 403 && error.response.data.requires_otp) {
        setPendingEmail(form.email);
        setShowOTPScreen(true);
        setOtpTimer(300); 
        
   
        sendOTPForLogin(form.email);
        
        Alert.alert(
          "Email Verification Required",
          "Please verify your email with the OTP code we've sent to complete your login."
        );
      } else if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Login failed.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendOTPForLogin = async (email) => {
    try {
      await axios.post(`${API_URL}/api/users/send-otp/`, {
        email: email,
      });
      console.log("OTP sent for login verification");
    } catch (error) {
      console.error("Failed to send OTP for login:", error);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert("Validation Error", "Please enter the OTP code.");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Validation Error", "OTP must be 6 digits long.");
      return;
    }

    console.log("=== FRONTEND OTP VERIFICATION DEBUG (SIGN-IN) ===");
    console.log("Pending email:", pendingEmail);
    console.log("OTP value:", otp);
    console.log("OTP type:", typeof otp);
    console.log("OTP length:", otp.length);
    console.log("API URL:", API_URL);

    const requestData = {
      email: pendingEmail,
      otp: otp,
    };
    console.log("Request data:", requestData);

    setIsVerifyingOTP(true);
    try {
      console.log("Sending request to:", `${API_URL}/api/users/verify-otp/`);
      const response = await axios.post(`${API_URL}/api/users/verify-otp/`, requestData);

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      if (response.status === 200) {
        console.log("OTP verification response:", response.data);
        
        
        if (response.data.access && response.data.refresh) {
          await login(response.data);
          Alert.alert(
            "Success!",
            "Email verified successfully! You are now logged in.",
            [
              {
                text: "Continue",
                onPress: () => {
                e
                  if (response.data.user?.user_type === "Vendor") {
                    router.push("/vendorhome");
                  } else {
                    router.push("/home");
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Success!",
            "Email verified successfully! Please try logging in again.",
            [
              {
                text: "OK",
                onPress: () => {
                  setShowOTPScreen(false);
                  setOtp("");
                  setPendingEmail("");
                }
              }
            ]
          );
        }
      } else {
        Alert.alert("Error", "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "OTP verification failed.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const resendOTP = async () => {
    setIsResendingOTP(true);
    try {
      const response = await axios.post(`${API_URL}/api/users/send-otp/`, {
        email: pendingEmail,
      });

      if (response.status === 200) {
        setOtpTimer(300); 
        setOtp(""); 
        Alert.alert("Success", "New OTP sent to your email!");
      } else {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Failed to resend OTP.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsResendingOTP(false);
    }
  };

  const goBackToSignIn = () => {
    setShowOTPScreen(false);
    setOtp("");
    setPendingEmail("");
    setOtpTimer(300);
  };

  if (showOTPScreen) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <ScrollView>
          <View className="items-center justify-center">
            <Image
              source={logo}
              resizeMode="contain"
              className="w-[250px] h-[170px]"
            />
          </View>
          <View className="w-full justify-center min-h-[60vh] px-4 mb-3">
            <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold">
              Verify Your Email
            </Text>
            
            <Text className="text-base text-gray-100 font-pregular mb-4">
              We've sent a 6-digit verification code to:
            </Text>
            <Text className="text-lg text-secondary font-pmedium mb-6">
              {pendingEmail}
            </Text>

            <FormField
              title="Enter OTP Code"
              value={otp}
              handleChangeText={setOtp}
              otherStyles="mt-4"
              keyboardType="numeric"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />

            <View className="flex-row justify-between items-center mt-4 mb-6">
              <Text className="text-sm text-gray-100 font-pregular">
                Code expires in: {formatTime(otpTimer)}
              </Text>
              {otpTimer === 0 && (
                <Text className="text-sm text-red-500 font-pmedium">
                  Code expired
                </Text>
              )}
            </View>

            <CustomButton
              title="Verify & Login"
              handlePress={verifyOTP}
              containerStyles="mt-4"
              isLoading={isVerifyingOTP}
              disabled={otpTimer === 0}
            />

            <CustomButton
              title={isResendingOTP ? "Resending..." : "Resend OTP"}
              handlePress={resendOTP}
              containerStyles="mt-4 bg-gray-600"
              isLoading={isResendingOTP}
              disabled={otpTimer > 240} 
            />

            <CustomButton
              title="Back to Sign In"
              handlePress={goBackToSignIn}
              containerStyles="mt-4 bg-transparent border border-secondary"
              textStyles="text-secondary"
            />

            <View className="justify-center pt-5 flex-row gap-2">
              <Text className="text-lg text-gray-100 font-pregular">
                Don't have an account?
              </Text>
              <Link
                href="/sign-up"
                className="text-lg font-psemibold text-secondary"
              >
                Sign Up
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="items-center justify-center">
          <Image source={logo} resizeMode="contain" className="w-[250px] h-[170px]" />
        </View>
        <View className="w-full justify-center min-h-[60vh] px-4 mb-3">
          <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold">
            Log in to RentSpot!
          </Text>

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) =>
              setForm({
                ...form,
                email: e,
              })
            }
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) =>
              setForm({
                ...form,
                password: e,
              })
            }
            otherStyles="mt-7"
            secureTextEntry={true} 
          />

          <CustomButton
            title="Sign in"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">Don't have an account?</Text>
            <Link href="/sign-up" className="text-lg font-psemibold text-secondary">
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
