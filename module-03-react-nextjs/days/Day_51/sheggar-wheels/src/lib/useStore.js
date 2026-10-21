'use client';

/**
 * Sheggar Wheels Reactive Storage Hook & State Provider
 * Provides synchronized state for cars, bookings, users, reviews, disputes, announcements,
 * and current auth session with cross-tab and in-tab reactive refresh.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  STORAGE_KEYS,
  readStorage,
  initializeDemoData,
  resetDemoData,
  subscribeToStorageChanges,
} from './storage';
import {
  getCurrentSession,
  signInAsDemo,
  signInWithEmail,
  registerUser,
  signOut,
} from './auth';
import {
  getApprovedCars,
  getCars,
  getBookings,
  getReviews,
  getDisputes,
  getAnnouncements,
  getUsers,
  createBooking,
  transitionBookingStatus,
  processMockPayment,
  createCarListing,
  updateCarListing,
  toggleCarActiveStatus,
  adminModerateCar,
  createReview,
  replyToReview,
  createDispute,
  resolveDispute,
  createAnnouncement,
  toggleAnnouncement,
  updateUserStatus,
} from './data';
import { BOOKING_STATES } from './bookingMachine';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info' }

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const refreshState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const { session: sess, user } = getCurrentSession();
    setSession(sess);
    setCurrentUser(user);

    setUsers(getUsers());
    setCars(getCars());
    setBookings(getBookings());
    setReviews(getReviews());
    setDisputes(getDisputes());
    setAnnouncements(getAnnouncements());
  }, []);

  useEffect(() => {
    // 1. Initialize demo data if not present
    initializeDemoData();
    setIsInitialized(true);
    refreshState();

    // 2. Subscribe to reactive storage changes
    const unsubscribe = subscribeToStorageChanges(() => {
      refreshState();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshState]);

  // Auth actions
  const handleSignInAsDemo = (userId) => {
    const res = signInAsDemo(userId);
    if (res.success) {
      refreshState();
      showToast(`Signed in as ${res.user.name}`, 'success');
    } else {
      showToast(res.error || 'Failed to sign in', 'error');
    }
    return res;
  };

  const handleSignInWithEmail = (email) => {
    const res = signInWithEmail(email);
    if (res.success) {
      refreshState();
      showToast(`Welcome back, ${res.user.name}`, 'success');
    } else {
      showToast(res.error || 'Failed to sign in', 'error');
    }
    return res;
  };

  const handleRegister = (payload) => {
    const res = registerUser(payload);
    if (res.success) {
      refreshState();
      showToast(`Account created! Welcome ${res.user.name}`, 'success');
    } else {
      showToast(res.error || 'Registration failed', 'error');
    }
    return res;
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleResetData = () => {
    resetDemoData();
    refreshState();
    showToast('Demo data reset to default seed state', 'info');
  };

  const value = {
    isInitialized,
    session,
    currentUser,
    users,
    cars,
    approvedCars: cars.filter((c) => c.status === 'approved'),
    bookings,
    reviews,
    disputes,
    announcements,
    activeAnnouncements: announcements.filter((a) => a.active),
    toast,
    showToast,
    refreshState,
    // Actions
    signInAsDemo: handleSignInAsDemo,
    signInWithEmail: handleSignInWithEmail,
    register: handleRegister,
    signOut: handleSignOut,
    resetData: handleResetData,
    // Data operations wrapped with UI toast & refresh
    createBooking: (payload) => {
      const res = createBooking(currentUser?.id, payload);
      if (res.success) {
        refreshState();
        showToast('Booking request submitted successfully!', 'success');
      } else {
        showToast(res.error || 'Could not create booking', 'error');
      }
      return res;
    },
    transitionBooking: (bookingId, targetStatus, metadata) => {
      const res = transitionBookingStatus(currentUser?.id, bookingId, targetStatus, metadata);
      if (res.success) {
        refreshState();
        showToast(`Booking updated to ${targetStatus.replace('_', ' ')}`, 'success');
      } else {
        showToast(res.error || 'Action failed', 'error');
      }
      return res;
    },
    payBooking: (bookingId, details) => {
      const res = processMockPayment(currentUser?.id, bookingId, details);
      if (res.success) {
        refreshState();
        showToast('Demo TeleBirr payment confirmed!', 'success');
      } else {
        showToast(res.error || 'Payment failed', 'error');
      }
      return res;
    },
    createCar: (carData) => {
      const res = createCarListing(currentUser?.id, carData);
      if (res.success) {
        refreshState();
        showToast('Car listed! Awaiting admin approval.', 'success');
      } else {
        showToast(res.error || 'Failed to list car', 'error');
      }
      return res;
    },
    updateCar: (carId, updates) => {
      const res = updateCarListing(currentUser?.id, carId, updates);
      if (res.success) {
        refreshState();
        showToast('Car listing updated successfully', 'success');
      } else {
        showToast(res.error || 'Failed to update car', 'error');
      }
      return res;
    },
    toggleCarStatus: (carId) => {
      const res = toggleCarActiveStatus(currentUser?.id, carId);
      if (res.success) {
        refreshState();
        showToast(`Vehicle status changed to ${res.car.status}`, 'info');
      } else {
        showToast(res.error || 'Action failed', 'error');
      }
      return res;
    },
    moderateCar: (carId, status, notes) => {
      const res = adminModerateCar(currentUser?.id, carId, status, notes);
      if (res.success) {
        refreshState();
        showToast(`Car ${status} successfully`, 'success');
      } else {
        showToast(res.error || 'Moderation failed', 'error');
      }
      return res;
    },
    submitReview: (payload) => {
      const res = createReview(currentUser?.id, payload);
      if (res.success) {
        refreshState();
        showToast('Review submitted! Thank you.', 'success');
      } else {
        showToast(res.error || 'Failed to submit review', 'error');
      }
      return res;
    },
    replyReview: (reviewId, text) => {
      const res = replyToReview(currentUser?.id, reviewId, text);
      if (res.success) {
        refreshState();
        showToast('Reply published successfully', 'success');
      } else {
        showToast(res.error || 'Failed to publish reply', 'error');
      }
      return res;
    },
    submitDispute: (payload) => {
      const res = createDispute(currentUser?.id, payload);
      if (res.success) {
        refreshState();
        showToast('Dispute opened. Our admin team will investigate.', 'info');
      } else {
        showToast(res.error || 'Failed to open dispute', 'error');
      }
      return res;
    },
    resolveDisputeAction: (disputeId, notes) => {
      const res = resolveDispute(currentUser?.id, disputeId, notes);
      if (res.success) {
        refreshState();
        showToast('Dispute resolved successfully', 'success');
      } else {
        showToast(res.error || 'Failed to resolve dispute', 'error');
      }
      return res;
    },
    updateUserStatusAction: (targetUserId, newStatus) => {
      const res = updateUserStatus(currentUser?.id, targetUserId, newStatus);
      if (res.success) {
        refreshState();
        showToast(`User status updated to ${newStatus}`, 'info');
      } else {
        showToast(res.error || 'Failed to update user', 'error');
      }
      return res;
    },
    createAnnouncementAction: (data) => {
      const res = createAnnouncement(currentUser?.id, data);
      if (res.success) {
        refreshState();
        showToast('Announcement posted', 'success');
      } else {
        showToast(res.error || 'Failed to post announcement', 'error');
      }
      return res;
    },
    toggleAnnouncementAction: (annId) => {
      const res = toggleAnnouncement(currentUser?.id, annId);
      if (res.success) {
        refreshState();
      }
      return res;
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
