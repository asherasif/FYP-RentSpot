import React from "react";
import { View, FlatList } from "react-native";
import CategoryButton from "./CategoryButton";
import {
  ToolIcon,
  Settings,
  Radio,
  Shirt,
  Boot,
  UtensilsCrossed,
  Sofa,
  Monitor,
  MoreHorizontal,
} from "lucide-react-native";

const ShowCategories = ({ categories = [], onSelectCategory }) => {
  const defaultCategories = [
    { name: "Tools", icon: ToolIcon },
    { name: "Equipment", icon: Settings },
    { name: "Appliances", icon: Radio },
    { name: "Apparel", icon: Shirt },
    { name: "Footwear", icon: Boot },
    { name: "Kitchenware", icon: UtensilsCrossed },
    { name: "Furniture", icon: Sofa },
    { name: "Computing", icon: Monitor },
    { name: "Others", icon: MoreHorizontal },
  ];

  const displayCategories =
    categories.length > 0
      ? categories.map((cat) => ({
          name: cat.label,
          value: cat.value,
          icon: cat.icon,
        }))
      : defaultCategories;

  return (
    <View className="mt-4">
      <FlatList
        data={displayCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.name || item.value}
        contentContainerStyle={{
          gap: 8, 
        }}
        renderItem={({ item }) => (
          <CategoryButton
            IconComponent={item.icon}
            IconName={item.name}
            categoryValue={item.value}
            onPress={() =>
              onSelectCategory &&
              onSelectCategory({
                label: item.name,
                value: item.value || item.name,
              })
            }
          />
        )}
      />
    </View>
  );
};

export default ShowCategories;
