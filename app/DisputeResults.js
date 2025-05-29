import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import logo from "../assets/images/RLogo.png";
import {AuthContext} from "./../context/AuthContext";
import axios from "axios";
import { API_URL } from "@env";

const DisputeResults = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [disputeItems, setDisputeItems] = useState([]);
  const { token } = useContext(AuthContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_URL}/api/disputes/my-disputes/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log("Fetched disputes:", response.data);
      setDisputeItems(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching disputes:", err);
      setError("Failed to load disputes. Please try again.");
      setIsLoading(false);
    }
  };

  
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return '#4CAF50'; // Green
      case 'pending':
        return '#FFC107'; // Yellow
      case 'processing':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Grey
    }
  };

  // Helper function to get outcome text
  const getOutcomeText = (outcome, atFault) => {
    if (outcome === 'valid') {
      if (atFault === 'owner') {
        return "Valid - Owner at fault";
      } else if (atFault === 'renter') {
        return "Valid - Renter at fault";
      } else if (atFault === 'both') {
        return "Valid - Both parties at fault";
      } else if (atFault === 'neither') {
        return "Valid - Neither at fault";
      }
      return "Valid";
    } else if (outcome === 'invalid') {
      return "Invalid";
    }
    return "Pending";
  };

  const Card = ({ disputeItem }) => (
    <View style={styles.card}>
      <Image 
        source={disputeItem.rental?.image ? { uri: disputeItem.rental.image } : logo} 
        resizeMode="contain" 
        style={styles.image} 
      />
      <View style={styles.content}>
        <Text style={styles.title}>{disputeItem.rental?.title || "Item"}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(disputeItem.status) }]}>
            Status: {disputeItem.status}
          </Text>
        </View>
        <TextInput
          style={styles.resultInput}
          value={getOutcomeText(disputeItem.outcome, disputeItem.at_fault)}
          editable={false}
        />
        {disputeItem.ai_analysis && (
          <TextInput
            style={styles.analysisInput}
            value={disputeItem.ai_analysis}
            multiline={true}
            numberOfLines={3}
            editable={false}
          />
        )}
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.proceedButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispute Results</Text>
        <TouchableOpacity onPress={fetchDisputes} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFA001" />
          <Text style={styles.loaderText}>Loading disputes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDisputes}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          {disputeItems.length > 0 ? (
            disputeItems.map((item) => (
              <Card key={`dispute_${item.id}`} disputeItem={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No disputes found</Text>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={() => router.push('/home')}
              >
                <Text style={styles.proceedButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#475FCB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1E1E2D",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginBottom: 11,
    elevation: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  statusContainer: {
    marginBottom: 5,
  },
  statusText: {
    fontWeight: "bold",
  },
  resultInput: {
    backgroundColor: "#2E2E3C",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  analysisInput: {
    backgroundColor: "#2E2E3C",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    height: 80,
    textAlignVertical: 'top',
  },
  proceedButton: {
    backgroundColor: "#475FCB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default DisputeResults;
