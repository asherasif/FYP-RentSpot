import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { router } from 'expo-router';
import {
  Bell,
  Home as HomeIcon,
  Sofa,
  Smartphone,
  Tent,
  PartyPopper,
  Baby,
  ToolIcon,
  Car,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Lamp
} from 'lucide-react-native';

import logo from '../../assets/images/RLogo.png';
import Search from '../../components/Search';
import Recommended from '../../components/Recommended'; 
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ShowCategories from '../../components/ShowCategories';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '@env';

const categories = [
  { label: "Home and Kitchen Appliances", value: "Home and Kitchen Appliances", icon: HomeIcon },
  { label: "Furniture", value: "Furniture", icon: Sofa },
  { label: "Electronics and Gadgets", value: "Electronics and Gadgets", icon: Smartphone },
  { label: "Outdoor and Sports Equipment", value: "Outdoor and Sports Equipment", icon: Tent },
  { label: "Event and Party Supplies", value: "Event and Party Supplies", icon: PartyPopper },
  { label: "Baby and Kids Items", value: "Baby and Kids Items", icon: Baby },
  { label: "Tools and Equipment", value: "Tools and Equipment", icon: ToolIcon },
  { label: "Vehicles", value: "Vehicles", icon: Car },
  { label: "Health and Wellness", value: "Health and Wellness", icon: HeartPulse },
  { label: "Educational Resources", value: "Educational Resources", icon: GraduationCap },
  { label: "Office Equipment", value: "Office Equipment", icon: Briefcase },
  { label: "Decor and Seasonal Items", value: "Decor and Seasonal Items", icon: Lamp },
];

const Home = () => {
  const { user, token } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [exploreItems, setExploreItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const [recommendationsRefreshKey, setRecommendationsRefreshKey] = useState(0);

  const fetchUnreadNotificationCount = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/api/notifications/count-unread/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data) {
        setNotificationCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Notification fetch error:', error.message);
    }
  };

  const fetchExploreItems = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/items/excludemyitems/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data) {
        setExploreItems(response.data);
      }
    } catch (error) {
      console.error('Explore items fetch error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExploreItems();
      fetchUnreadNotificationCount();

      setRecommendationsRefreshKey(prevKey => prevKey + 1);
    }
  }, [token]);

  const handleCategorySelect = (category) => {
    router.push(`/category/${category.value}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchExploreItems(),
      fetchUnreadNotificationCount(),
     
      setRecommendationsRefreshKey(prevKey => prevKey + 1)
    ]);
    setRefreshing(false);
  };

  const ListHeader = useMemo(() => (
    <View className="my-6 px-4 space-y-6">

      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-x-4 flex-1">
          <View>
            <Text className="font-pmedium text-sm text-gray-100">Welcome!</Text>
            <Text className="text-2xl font-psemibold text-white" numberOfLines={1} ellipsizeMode="tail">
              {user?.username || 'User'}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/notifications')} className="ml-1 mt-5 relative">
            <Bell color="white" size={23} />
            {notificationCount > 0 && (
              <View
                className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center"
                style={{ width: 16, height: 16 }}
              >
                <Text className="text-white text-[10px] font-bold">
                  {notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Image
          source={logo}
          className="h-[65px]"
          style={{ width: 100 }}
          resizeMode="contain"
        />
      </View>

      <Search />

      <View className="w-full">
        <Text className="text-lg font-pregular mb-1 text-white">Categories</Text>
        <ShowCategories categories={categories} onSelectCategory={handleCategorySelect} />
      </View>

      <View className="w-full flex-1 pt-2 pb-4">
        <Text className="text-lg font-pregular mb-3 text-white">Recommended Items</Text>
      
        <Recommended key={recommendationsRefreshKey} />
      </View>

      <Text className="text-lg font-pregular mb-1 text-white">Explore Items</Text>
    </View>
  ), [user?.username, notificationCount, recommendationsRefreshKey]); 

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={exploreItems}
        keyExtractor={(item) => (item.productID || item.id)?.toString()}
        renderItem={({ item }) => (
          <View style={{ flex: 1 / 2, padding: 10 }}>
            <ProductCard product={item} />
          </View>
        )}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!loading ? () => <EmptyState title="No Items Found" /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? () => (
          <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
        ) : null}
      />
    </SafeAreaView>
  );
};

export default Home;