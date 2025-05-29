import { 
  View, 
  Text, 
  ImageBackground, 
  TouchableOpacity, 
  Keyboard, 
  TouchableWithoutFeedback, 
  Image 
} from "react-native";
import React, { useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { AuthContext } from "../../context/AuthContext";
import Furniture from "../../assets/icons/living-room.png";
import CustomButton from "../../components/CustomButton";
import avatarSource1 from "../../assets/icons/profile.png";
import { useRouter } from 'expo-router';

const Profile = () => {
  const { user, logout } = useContext(AuthContext); 
  const username = user?.username || "Unknown User"; 

    const router = useRouter();
  const avatarSource = user?.avatar && typeof user.avatar === "string" ? 
    { uri: user.avatar } : 
    Furniture;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="bg-primary px-8 flex-1 h-full">
        <View className="items-center mt-4">
          {/* Profile Picture */}
          <TouchableOpacity activeOpacity={1}>
            <View className="h-36 w-28 rounded-lg justify-center items-center">
              <ImageBackground
                source={avatarSource1} 
                className="h-24 w-24"
                imageStyle={{ borderRadius: 15 }}
              />
            </View>
          </TouchableOpacity>
          <Text className="mt-4 text-lg font-bold text-white">
            {user?.email || "example@example.com"}
          </Text>
        </View>


        <View className="w-full border-2 border-black-200 px-4 h-16 bg-black-100 rounded-2xl items-center focus:border-secondary flex-row space-x-4 mt-8">
          <Text
            className="flex-1 p-0 text-white font-pregular"
            style={{ opacity: 1 }}
          >
            {username}
          </Text>
        </View>


        <TouchableOpacity
          className="w-full border-2 border-black-200 px-4 h-16 bg-black-100 rounded-2xl items-center focus:border-secondary flex-row space-x-4 mt-6"
          activeOpacity={1}
          onPress={() => router.push('MyProductsList')}
        >
          <Text
            className="text-base mt-0.5 flex-1 text-white font-pregular"
            style={{ opacity: 1 }}
          > 
            My Products
          </Text>
          <Image
            source={require("../../assets/icons/right-arrow.png")} 
            className="w-5 h-5"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full border-2 border-black-200 px-4 h-16 bg-black-100 rounded-2xl items-center focus:border-secondary flex-row space-x-4 mt-6"
          activeOpacity={1}
          onPress={() => router.push('MySavedProducts')}
        >
          <Text
            className="text-base mt-0.5 flex-1 text-white font-pregular"
            style={{ opacity: 1 }}
          >
            Saved Products
          </Text>
          <Image
            source={require("../../assets/icons/right-arrow.png")} 
            className="w-5 h-5"
            resizeMode="contain"
          />
        </TouchableOpacity>

      
        <CustomButton
          title="Log out"
          handlePress={logout} 
          containerStyles="mt-7"
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Profile;
