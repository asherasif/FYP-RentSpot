import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from "@env";
import { AuthContext } from '../../context/AuthContext';

const Bookmark = () => {
  const [selectedTab, setSelectedTab] = useState('requested');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [reservations, setReservations] = useState([]);
  const router = useRouter();
  const { token } = useContext(AuthContext);


  const refreshBookmarks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  

  const fetchReservations = useCallback(async () => {
    if (!token) {
      console.error('No auth token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log("Fetching reservations from:", `${API_URL}/api/bookings/reservations/`);
      const response = await axios.get(
        `${API_URL}/api/bookings/reservations/`, 
        { headers }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        console.log("Setting reservations:", response.data);
        setReservations(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error.message);
      console.error("Error response:", error.response?.data);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);
  

  const fetchBookmarks = useCallback(async () => {
    if (!token) {
      console.error('No auth token found');
      setLoading(false);
      return;
    }


    const now = Date.now();
    if (now - lastFetchTime < 5000 && lastFetchTime !== 0) {
      return;
    }
    
    try {
      setLoading(true);
      setLastFetchTime(now);
      
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };


      const [incomingResponse, myRequestsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/bookings/incomingrequests/`, { headers }),
        axios.get(`${API_URL}/api/bookings/myrequests/`, { headers })
      ]);
      

      const processedIncomingRequests = incomingResponse.data.map(request => {
        if (request.status === 'pending') {

          const requestDate = new Date(request.created_at || request.request_date || request.date);
          const currentDate = new Date();
          const timeDifference = currentDate - requestDate;
          const hoursDifference = timeDifference / (1000 * 60 * 60);
          
          if (hoursDifference > 24) {
            return { ...request, status: 'expired' };
          }
        }
        return request;
      });

      const processedMyRequests = myRequestsResponse.data.map(request => {
        if (request.status === 'pending') {
          const requestDate = new Date(request.created_at || request.request_date || request.date);
          const currentDate = new Date();
          const timeDifference = currentDate - requestDate;
          const hoursDifference = timeDifference / (1000 * 60 * 60);
       
          if (hoursDifference > 24) {
            return { ...request, status: 'expired' };
          }
        }
        return request;
      });
      
      setIncomingRequests(processedIncomingRequests);
      setMyRequests(processedMyRequests);
    } catch (error) {
      console.error("Error fetching bookmarks:", error.message);
    } finally {
      setLoading(false);
    }
  }, [token, lastFetchTime]);

  useEffect(() => {
    fetchBookmarks();
    

    if (selectedTab === 'approved') {
      fetchReservations();
    }
  }, [fetchBookmarks, fetchReservations, refreshTrigger, selectedTab]);


  const filteredData = useMemo(() => {
    return {
      pendingIncoming: incomingRequests.filter(item => item.status === 'pending'),
      pendingOutgoing: myRequests.filter(item => item.status === 'pending'),
      approvedIncoming: incomingRequests.filter(item => item.status === 'approved'),
      approvedOutgoing: myRequests.filter(item => item.status === 'approved'),
      expiredIncoming: incomingRequests.filter(item => item.status === 'expired'),
      expiredOutgoing: myRequests.filter(item => item.status === 'expired')
    };
  }, [incomingRequests, myRequests]);

  const getBookingId = useCallback((item) => {
    return item.id || item.booking_id || item._id || item.bookingId || item.booking;
  }, []);


  const handleApprove = useCallback(async (bookingId) => {
    if (!token || !bookingId) return;

    try {

      setIncomingRequests(prevRequests => 
        prevRequests.map(request => 
          getBookingId(request) === bookingId ? { ...request, status: 'approved' } : request
        )
      );

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.patch(
        `${API_URL}/api/bookings/update-status/${bookingId}/`,
        { status: 'approved' },
        { headers }
      );
    } catch (error) {
      console.error("Error approving booking:", error.message);

      refreshBookmarks();
    }
  }, [token, getBookingId, refreshBookmarks]);


  const handleReject = useCallback(async (bookingId) => {
    if (!token || !bookingId) return;

    try {
     
      setIncomingRequests(prevRequests => 
        prevRequests.map(request => 
          getBookingId(request) === bookingId ? { ...request, status: 'rejected' } : request
        )
      );

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.patch(
        `${API_URL}/api/bookings/update-status/${bookingId}/`,
        { status: 'rejected' },
        { headers }
      );
    } catch (error) {
      console.error("Error rejecting booking:", error.message);

      refreshBookmarks();
    }
  }, [token, getBookingId, refreshBookmarks]);


  const handleCancelRequest = useCallback(async (bookingId) => {
    if (!token || !bookingId) return;

    try {
     
      setMyRequests(prevRequests => 
        prevRequests.filter(request => getBookingId(request) !== bookingId)
      );

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.delete(
        `${API_URL}/api/bookings/cancel/${bookingId}/`,
        { headers }
      );
    } catch (error) {
      console.error("Error cancelling booking:", error.message);
 
      refreshBookmarks();
    }
  }, [token, getBookingId, refreshBookmarks]);


  const checkBookingReadyForDelivery = useCallback(async (bookingId) => {
    if (!token || !bookingId) return false;
    
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Get booking details from backend
      const response = await axios.get(
        `${API_URL}/api/bookings/delivery-details/${bookingId}/`,
        { headers }
      );

      return true; 
    } catch (error) {
 
      if (error.response?.status === 400) {
        console.log("Booking not ready:", error.response.data.message);
      } else {
        console.error("Error checking booking status:", error.message);
      }
      return false;
    }
  }, [token]);


  const fetchReservationDetails = useCallback(async (bookingId) => {
    if (!token || !bookingId) {
      console.error('Missing token or booking ID for fetching reservation details');
      return null;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };


      const response = await axios.get(
        `${API_URL}/api/bookings/reservations/`,
        { headers }
      );
      
      console.log("All reservations retrieved:", response.data);
      
    
      const bookingDetails = response.data.find(reservation => reservation.id === Number(bookingId));
      
      if (bookingDetails) {
        console.log("Found matching reservation details:", bookingDetails);
        return bookingDetails;
      } else {
        console.error("No matching reservation found for ID:", bookingId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching reservations:", error.message);
      return null;
    }
  }, [token]);

  const IncomingRequestCard = memo(({ item }) => {
    const title = item.item_title || "Untitled Item";
    const renterName = item.renter_name || "Unknown User";
    const status = item.status || "pending";
    const imageUrl = item.image_url || 'https://via.placeholder.com/150';
    const bookingId = getBookingId(item);

    return (
      <View key={bookingId || `incoming-${Math.random()}`} style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardDetails}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.categoryText}>
              Requested by: {renterName}
            </Text>
            <View style={[styles.statusBadge, 
              status === 'approved' ? styles.statusApproved : 
              status === 'pending' ? styles.statusPending : 
              status === 'rejected' ? styles.statusRejected : 
              status === 'expired' ? styles.statusExpired : 
              styles.statusDefault]}>
              <Text style={styles.statusText}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {status === 'pending' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.rejectButton} 
              onPress={() => bookingId && handleReject(bookingId)}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.approveButton} 
              onPress={() => bookingId && handleApprove(bookingId)}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'approved' && (
          <TouchableOpacity 
            style={styles.deliveryButton}
            onPress={() => {
              console.log("Initiate Delivery button clicked with item:", {
                id: getBookingId(item),
                total_price: item.total_price || 1500
              });
             
              router.push(`/Paymentgateway?bookingId=${getBookingId(item)}&amount=${item.total_price || 1500}`);
            }}
          >
            <Text style={styles.buttonText}>Initiate Delivery</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  });

  const MyRequestCard = memo(({ item }) => {
    const title = item.item_title || "Untitled Item";
    const renteeName = item.rentee_name || "Unknown Owner";
    const status = item.status || "pending";
    const imageUrl = item.image_url || 'https://via.placeholder.com/150';
    const bookingId = getBookingId(item);
    

    const createdDate = useMemo(() => {
      if (!item.created_at) return "Not specified";
      const date = new Date(item.created_at);
      return date.toLocaleDateString();
    }, [item.created_at]);

    return (
      <View key={bookingId || `mine-${Math.random()}`} style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardDetails}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.categoryText}>
              Owner: {renteeName}
            </Text>
            <View style={[styles.statusBadge, 
              status === 'approved' ? styles.statusApproved : 
              status === 'pending' ? styles.statusPending : 
              status === 'rejected' ? styles.statusRejected : 
              status === 'expired' ? styles.statusExpired : 
              styles.statusDefault]}>
              <Text style={styles.statusText}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
              </Text>
            </View>
            {status === 'approved' && (
              <Text style={styles.startDateText}>
                Requested on: {createdDate}
              </Text>
            )}
          </View>
        </View>

        {status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => bookingId && handleCancelRequest(bookingId)}
          >
            <Text style={styles.buttonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {status === 'approved' && (
          <TouchableOpacity 
            style={styles.deliveryButton}
            onPress={() => {
              console.log("Initiate Delivery button clicked with item:", {
                id: getBookingId(item),
                total_price: item.total_price || 1500
              });
   
              router.push(`/Paymentgateway?bookingId=${getBookingId(item)}&amount=${item.total_price || 1500}`);
            }}
          >
            <Text style={styles.buttonText}>Initiate Delivery</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  });


  const handleRequestedTab = useCallback(() => {
    setSelectedTab('requested');
  }, []);

  const handleApprovedTab = useCallback(() => {
    setSelectedTab('approved');
  }, []);


  const handlePushToPayment = useCallback(() => {
    router.push('Paymentgateway');
  }, [router]);

  const ReservationCard = memo(({ item }) => {
    console.log("Rendering Reservation Card with item:", {
      id: item.id,
      total_price: item.total_price,
      item_name: item.item_name,
      start_date: item.start_date,
      end_date: item.end_date
    });
    
    return (
      <View
        key={item.id || `reservation-${Math.random()}`}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
            style={styles.cardImage}
          />
          <View style={styles.cardDetails}>
            <Text style={styles.titleText}>
              {item.item_name}
            </Text>
            <Text style={styles.categoryText}>
              Owner: {item.owner_name}
            </Text>
            {item.start_date && item.end_date && (
              <Text style={styles.dateText}>
                {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
              </Text>
            )}
            {item.total_price && (
              <Text style={styles.priceText}>
                Total: PKR {item.total_price}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deliveryButton}
          onPress={() => {
            console.log("Make Payment button clicked with item:", {
              id: item.id,
              total_price: item.total_price,
              item_name: item.item_name
            });
            
            router.push(`/Paymentgateway?bookingId=${item.id}&amount=${item.total_price}`);
          }}
        >
          <Text style={styles.buttonText}>Initiate Delivery</Text>
        </TouchableOpacity>
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={handleRequestedTab}
            style={[
              styles.tabButton,
              selectedTab === 'requested' && styles.activeTab
            ]}
          >
            <Text style={styles.tabText}>Requested</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApprovedTab}
            style={[
              styles.tabButton,
              selectedTab === 'approved' && styles.activeTab
            ]}
          >
            <Text style={styles.tabText}>Approved</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : selectedTab === 'requested' ? (
            <>
              {/* Incoming Requests Section */}
              <Text style={styles.sectionTitle}>Incoming Requests</Text>
              {filteredData.pendingIncoming.length === 0 ? (
                <Text style={styles.emptyStateText}>No pending incoming requests</Text>
              ) : (
                filteredData.pendingIncoming.map(item => (
                  <IncomingRequestCard 
                    key={getBookingId(item) || `incoming-${Math.random()}`} 
                    item={item}
                  />
                ))
              )}

              {/* My Requests Section */}
              <Text style={[styles.sectionTitle, styles.sectionSpacing]}>My Requests</Text>
              {filteredData.pendingOutgoing.length === 0 ? (
                <Text style={styles.emptyStateText}>No pending outgoing requests</Text>
              ) : (
                filteredData.pendingOutgoing.map(item => (
                  <MyRequestCard 
                    key={getBookingId(item) || `mine-${Math.random()}`} 
                    item={item}
                  />
                ))
              )}
              

              {(filteredData.expiredIncoming.length > 0 || filteredData.expiredOutgoing.length > 0) && (
                <>
                  <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Expired Requests</Text>
                  
             
                  {filteredData.expiredIncoming.length > 0 && (
                    <>
                      <Text style={styles.subSectionTitle}>Incoming Expired</Text>
                      {filteredData.expiredIncoming.map(item => (
                        <IncomingRequestCard 
                          key={getBookingId(item) || `incoming-expired-${Math.random()}`} 
                          item={item}
                        />
                      ))}
                    </>
                  )}
                  
          
                  {filteredData.expiredOutgoing.length > 0 && (
                    <>
                      <Text style={[styles.subSectionTitle, filteredData.expiredIncoming.length > 0 ? styles.sectionSpacing : null]}>
                        Outgoing Expired
                      </Text>
                      {filteredData.expiredOutgoing.map(item => (
                        <MyRequestCard 
                          key={getBookingId(item) || `mine-expired-${Math.random()}`} 
                          item={item}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              
              <Text style={styles.sectionTitle}>Approved Items</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3498db" />
                  <Text style={styles.loadingText}>Loading reservations...</Text>
                </View>
              ) : reservations.length === 0 ? (
                <Text style={styles.emptyStateText}>No approved items</Text>
              ) : (
                reservations.map(item => (
                  <ReservationCard 
                    key={item.id || `reservation-${Math.random()}`} 
                    item={item}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#161622',
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#161622',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabButton: {
    padding: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  scrollView: {
    marginTop: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  subSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    marginLeft: 8,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  emptyStateText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#1E1E2D',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 15,
  },
  cardDetails: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusApproved: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  statusPending: {
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  statusRejected: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  statusExpired: {
    backgroundColor: 'rgba(127, 140, 141, 0.2)',
    borderWidth: 1,
    borderColor: '#7f8c8d',
  },
  statusDefault: {
    backgroundColor: 'rgba(189, 195, 199, 0.2)',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    padding: 8,
    borderRadius: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 14,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },
  deliveryButton: {
    marginTop: 14,
    backgroundColor: '#27ae60',
    padding: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  startDateText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic'
  },
  dateText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  priceText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10
  },
});

export default Bookmark;