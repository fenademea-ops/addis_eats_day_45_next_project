/**
 * Sheggar Wheels Data Store & Business Logic
 * All storage mutations and strict security checks live here.
 * Rule: Session exists → Not suspended → Correct role → Record ownership → Valid transition.
 * UI hiding is not enough — errors are enforced here.
 */

import { STORAGE_KEYS, readStorage, writeStorage, generateId } from './storage';
import { canTransition, BOOKING_STATES } from './bookingMachine';
import {
  validateDateRange,
  isCarAvailableForDates,
  isPositivePrice,
  validateRequiredFields,
} from './validation';
import { hasRole, isUserSuspended } from './auth';

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------

export function getUsers() {
  return readStorage(STORAGE_KEYS.USERS, []);
}

export function getUserById(id) {
  if (!id) return null;
  const users = getUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * Suspend or reinstate a user (Admin only)
 * @param {string} adminUserId
 * @param {string} targetUserId
 * @param {'active'|'suspended'} newStatus
 */
export function updateUserStatus(adminUserId, targetUserId, newStatus) {
  if (!adminUserId) return { success: false, error: 'Not signed in' };

  const admin = getUserById(adminUserId);
  if (!admin || !hasRole(admin, 'admin')) {
    return { success: false, error: 'Unauthorized: Admin role required' };
  }
  if (isUserSuspended(admin)) {
    return { success: false, error: 'Your account is suspended' };
  }
  if (adminUserId === targetUserId) {
    return { success: false, error: 'You cannot suspend your own admin account' };
  }

  const users = getUsers();
  const targetIndex = users.findIndex((u) => u.id === targetUserId);
  if (targetIndex === -1) {
    return { success: false, error: 'User not found' };
  }

  users[targetIndex].status = newStatus;
  writeStorage(STORAGE_KEYS.USERS, users);
  return { success: true, user: users[targetIndex] };
}

// -------------------------------------------------------------
// CAR OPERATIONS
// -------------------------------------------------------------

export function getCars() {
  return readStorage(STORAGE_KEYS.CARS, []);
}

/**
 * Publicly visible approved cars
 */
export function getApprovedCars() {
  const cars = getCars();
  return cars.filter((c) => c.status === 'approved');
}

export function getCarById(id) {
  if (!id) return null;
  const cars = getCars();
  return cars.find((c) => c.id === id) || null;
}

/**
 * Create a new car listing (Owner only)
 * Automatically places listing into 'pending' status for admin review.
 */
export function createCarListing(ownerUserId, carData) {
  if (!ownerUserId) return { success: false, error: 'Not signed in' };

  const owner = getUserById(ownerUserId);
  if (!owner) return { success: false, error: 'User not found' };
  if (isUserSuspended(owner)) return { success: false, error: 'Your account is suspended' };
  if (!hasRole(owner, 'owner')) return { success: false, error: 'Owner role required' };

  const required = validateRequiredFields(carData, [
    'make',
    'model',
    'year',
    'transmission',
    'seats',
    'neighbourhood',
    'pricePerDay',
    'description',
  ]);
  if (!required.valid) {
    return { success: false, error: `Missing required field: ${required.missing.join(', ')}` };
  }

  if (!isPositivePrice(carData.pricePerDay)) {
    return { success: false, error: 'Price per day must be a positive number' };
  }

  const cars = getCars();
  const newCar = {
    id: generateId('car'),
    ownerId: ownerUserId,
    make: carData.make.trim(),
    model: carData.model.trim(),
    year: Number(carData.year),
    transmission: carData.transmission,
    seats: Number(carData.seats),
    city: 'Addis Ababa',
    neighbourhood: carData.neighbourhood.trim(),
    latitude: Number(carData.latitude) || 9.01,
    longitude: Number(carData.longitude) || 38.76,
    pricePerDay: Number(carData.pricePerDay),
    photos:
      Array.isArray(carData.photos) && carData.photos.length > 0
        ? carData.photos
        : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
    description: carData.description.trim(),
    features: Array.isArray(carData.features) ? carData.features : ['Air Conditioning', 'Bluetooth'],
    status: 'pending', // New cars always enter 'pending'
    unavailableDates: Array.isArray(carData.unavailableDates) ? carData.unavailableDates : [],
    createdAt: new Date().toISOString(),
  };

  cars.unshift(newCar);
  writeStorage(STORAGE_KEYS.CARS, cars);
  return { success: true, car: newCar };
}

/**
 * Update an existing car listing (Owner only, strictly checks ownership)
 */
export function updateCarListing(ownerUserId, carId, updates) {
  if (!ownerUserId) return { success: false, error: 'Not signed in' };

  const owner = getUserById(ownerUserId);
  if (!owner) return { success: false, error: 'User not found' };
  if (isUserSuspended(owner)) return { success: false, error: 'Your account is suspended' };

  const cars = getCars();
  const index = cars.findIndex((c) => c.id === carId);
  if (index === -1) return { success: false, error: 'Car not found' };

  const car = cars[index];
  // Ownership check
  if (car.ownerId !== ownerUserId && !hasRole(owner, 'admin')) {
    return { success: false, error: 'Not yours' };
  }

  if (updates.pricePerDay !== undefined && !isPositivePrice(updates.pricePerDay)) {
    return { success: false, error: 'Price must be a positive number' };
  }

  // Preserve core immutable properties
  const updatedCar = {
    ...car,
    ...updates,
    id: car.id,
    ownerId: car.ownerId,
    createdAt: car.createdAt,
    updatedAt: new Date().toISOString(),
  };

  cars[index] = updatedCar;
  writeStorage(STORAGE_KEYS.CARS, cars);
  return { success: true, car: updatedCar };
}

/**
 * Toggle car active/inactive status (Owner only, checks ownership)
 */
export function toggleCarActiveStatus(ownerUserId, carId) {
  if (!ownerUserId) return { success: false, error: 'Not signed in' };

  const cars = getCars();
  const car = cars.find((c) => c.id === carId);
  if (!car) return { success: false, error: 'Car not found' };

  if (car.ownerId !== ownerUserId) {
    const user = getUserById(ownerUserId);
    if (!hasRole(user, 'admin')) {
      return { success: false, error: 'Not yours' };
    }
  }

  const nextStatus = car.status === 'inactive' ? 'approved' : 'inactive';
  return updateCarListing(ownerUserId, carId, { status: nextStatus });
}

/**
 * Moderate car listing (Admin only)
 */
export function adminModerateCar(adminUserId, carId, status, moderationNotes = '') {
  if (!adminUserId) return { success: false, error: 'Not signed in' };

  const admin = getUserById(adminUserId);
  if (!admin || !hasRole(admin, 'admin')) {
    return { success: false, error: 'Unauthorized: Admin role required' };
  }

  const cars = getCars();
  const index = cars.findIndex((c) => c.id === carId);
  if (index === -1) return { success: false, error: 'Car not found' };

  cars[index].status = status; // 'approved' | 'rejected'
  cars[index].moderationNotes = moderationNotes;
  cars[index].moderatedAt = new Date().toISOString();

  writeStorage(STORAGE_KEYS.CARS, cars);
  return { success: true, car: cars[index] };
}

// -------------------------------------------------------------
// BOOKING OPERATIONS
// -------------------------------------------------------------

export function getBookings() {
  return readStorage(STORAGE_KEYS.BOOKINGS, []);
}

export function getBookingById(id) {
  if (!id) return null;
  const bookings = getBookings();
  return bookings.find((b) => b.id === id) || null;
}

/**
 * Check if an actor is authorized to view a private booking record.
 * Allowed: The booking's renter, the booking's car host, or an admin.
 * Denied: Any other user or unauthenticated visitor.
 * @param {string|null} userId
 * @param {string} bookingId
 * @returns {{ allowed: boolean, booking?: Object, error?: string }}
 */
export function canUserAccessBooking(userId, bookingId) {
  if (!userId) return { allowed: false, error: 'Not signed in' };
  const user = getUserById(userId);
  if (!user) return { allowed: false, error: 'User not found' };
  const booking = getBookingById(bookingId);
  if (!booking) return { allowed: false, error: 'Booking not found' };

  if (hasRole(user, 'admin')) {
    return { allowed: true, booking };
  }
  if (booking.renterId === userId || booking.ownerId === userId) {
    return { allowed: true, booking };
  }
  return { allowed: false, error: 'Not yours' };
}

/**
 * Create a new booking request (Renter only)
 * Negative test rule: Call booking function without session → "Not signed in", no booking created.
 */
export function createBooking(renterUserId, { carId, startDate, endDate }) {
  if (!renterUserId) {
    return { success: false, error: 'Not signed in' };
  }

  const renter = getUserById(renterUserId);
  if (!renter) {
    return { success: false, error: 'User not found' };
  }
  if (isUserSuspended(renter)) {
    return { success: false, error: 'Your account is suspended' };
  }

  const car = getCarById(carId);
  if (!car) {
    return { success: false, error: 'Car not found' };
  }
  if (car.status !== 'approved') {
    return { success: false, error: 'This car is not currently available for booking' };
  }

  if (car.ownerId === renterUserId) {
    return { success: false, error: 'You cannot book your own vehicle' };
  }

  const dateCheck = validateDateRange(startDate, endDate);
  if (!dateCheck.valid) {
    return { success: false, error: dateCheck.error };
  }

  const existingBookings = getBookings();
  const availability = isCarAvailableForDates(
    carId,
    startDate,
    endDate,
    existingBookings,
    car.unavailableDates
  );
  if (!availability.available) {
    return { success: false, error: availability.reason || 'Car is not available for chosen dates' };
  }

  const days = dateCheck.days;
  const pricePerDay = car.pricePerDay;
  const subtotal = days * pricePerDay;
  const fee = Math.round(subtotal * 0.1); // 10% platform fee
  const total = subtotal + fee;

  const newBooking = {
    id: generateId('booking'),
    carId,
    renterId: renterUserId,
    ownerId: car.ownerId,
    startDate,
    endDate,
    days,
    pricePerDay,
    subtotal,
    fee,
    total,
    paymentStatus: 'pending',
    status: BOOKING_STATES.REQUESTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  existingBookings.unshift(newBooking);
  writeStorage(STORAGE_KEYS.BOOKINGS, existingBookings);

  return { success: true, booking: newBooking };
}

/**
 * Transition booking lifecycle state
 * Strictly checks: Session → Suspended → Actor Role & Ownership → Valid State Transition.
 */
export function transitionBookingStatus(actorUserId, bookingId, targetStatus, metadata = {}) {
  if (!actorUserId) {
    return { success: false, error: 'Not signed in' };
  }

  const actor = getUserById(actorUserId);
  if (!actor) {
    return { success: false, error: 'User not found' };
  }
  if (isUserSuspended(actor)) {
    return { success: false, error: 'Your account is suspended' };
  }

  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return { success: false, error: 'Booking not found' };
  }

  const booking = bookings[index];

  // Determine actor's role relative to this booking
  let actorRole = null;
  if (hasRole(actor, 'admin')) {
    actorRole = 'admin';
  } else if (booking.ownerId === actorUserId) {
    actorRole = 'owner';
  } else if (booking.renterId === actorUserId) {
    actorRole = 'renter';
  } else {
    // Record ownership check failed!
    return { success: false, error: 'Not yours' };
  }

  // Check valid lifecycle transition
  if (!canTransition(booking.status, targetStatus, actorRole)) {
    return {
      success: false,
      error: `Invalid transition: Cannot change booking from "${booking.status}" to "${targetStatus}" as ${actorRole}`,
    };
  }

  // If owner confirms booking, ensure no overlapping confirmed/in_progress bookings exist
  if (targetStatus === BOOKING_STATES.CONFIRMED) {
    const car = getCarById(booking.carId);
    const availability = isCarAvailableForDates(
      booking.carId,
      booking.startDate,
      booking.endDate,
      bookings,
      car?.unavailableDates || [],
      booking.id
    );
    if (!availability.available) {
      return {
        success: false,
        error: `Cannot approve: ${availability.reason}`,
      };
    }
  }

  // Apply transition
  booking.status = targetStatus;
  booking.updatedAt = new Date().toISOString();

  if (metadata.declineReason) booking.declineReason = metadata.declineReason;
  if (metadata.cancellationReason) booking.cancellationReason = metadata.cancellationReason;
  if (metadata.paymentStatus) booking.paymentStatus = metadata.paymentStatus;
  if (metadata.paymentRef) booking.paymentRef = metadata.paymentRef;

  bookings[index] = booking;
  writeStorage(STORAGE_KEYS.BOOKINGS, bookings);

  return { success: true, booking };
}

/**
 * Process mock checkout / TeleBirr payment for a booking
 */
export function processMockPayment(renterUserId, bookingId, paymentDetails = {}) {
  if (!renterUserId) return { success: false, error: 'Not signed in' };

  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  if (booking.renterId !== renterUserId) {
    return { success: false, error: 'Not yours' };
  }

  const fakeRef = `TB-DEMO-${Math.floor(10000 + Math.random() * 90000)}`;

  return transitionBookingStatus(renterUserId, bookingId, BOOKING_STATES.CONFIRMED, {
    paymentStatus: 'paid_mock',
    paymentRef: fakeRef,
    ...paymentDetails,
  });
}

// -------------------------------------------------------------
// REVIEW OPERATIONS
// -------------------------------------------------------------

export function getReviews() {
  return readStorage(STORAGE_KEYS.REVIEWS, []);
}

export function getReviewsByCarId(carId) {
  const reviews = getReviews();
  return reviews.filter((r) => r.carId === carId);
}

/**
 * Submit a review (Renter only, strictly after completed booking)
 */
export function createReview(renterUserId, { bookingId, rating, comment }) {
  if (!renterUserId) return { success: false, error: 'Not signed in' };

  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  if (booking.renterId !== renterUserId) {
    return { success: false, error: 'Not yours' };
  }

  if (booking.status !== BOOKING_STATES.COMPLETED) {
    return { success: false, error: 'You can only review completed trips' };
  }

  const existingReviews = getReviews();
  if (existingReviews.some((r) => r.bookingId === bookingId)) {
    return { success: false, error: 'A review has already been submitted for this trip' };
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5 stars' };
  }

  if (!comment || !comment.trim()) {
    return { success: false, error: 'Please enter a review comment' };
  }

  const newReview = {
    id: generateId('rev'),
    bookingId,
    carId: booking.carId,
    renterId: renterUserId,
    ownerId: booking.ownerId,
    rating: numericRating,
    comment: comment.trim(),
    ownerReply: null,
    createdAt: new Date().toISOString(),
  };

  existingReviews.unshift(newReview);
  writeStorage(STORAGE_KEYS.REVIEWS, existingReviews);

  // Transition booking to reviewed
  transitionBookingStatus(renterUserId, bookingId, BOOKING_STATES.REVIEWED);

  return { success: true, review: newReview };
}

/**
 * Owner reply to a review
 */
export function replyToReview(ownerUserId, reviewId, replyText) {
  if (!ownerUserId) return { success: false, error: 'Not signed in' };

  const reviews = getReviews();
  const index = reviews.findIndex((r) => r.id === reviewId);
  if (index === -1) return { success: false, error: 'Review not found' };

  const review = reviews[index];
  if (review.ownerId !== ownerUserId) {
    return { success: false, error: 'Not yours' };
  }

  if (!replyText || !replyText.trim()) {
    return { success: false, error: 'Reply text cannot be empty' };
  }

  review.ownerReply = replyText.trim();
  review.repliedAt = new Date().toISOString();
  reviews[index] = review;

  writeStorage(STORAGE_KEYS.REVIEWS, reviews);
  return { success: true, review };
}

// -------------------------------------------------------------
// DISPUTE OPERATIONS
// -------------------------------------------------------------

export function getDisputes() {
  return readStorage(STORAGE_KEYS.DISPUTES, []);
}

export function getDisputeById(id) {
  if (!id) return null;
  const disputes = getDisputes();
  return disputes.find((d) => d.id === id) || null;
}

/**
 * Open a dispute (Only related renter or owner)
 */
export function createDispute(actorUserId, { bookingId, reason, description }) {
  if (!actorUserId) return { success: false, error: 'Not signed in' };

  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  // Check authorization: must be either renter or owner
  if (booking.renterId !== actorUserId && booking.ownerId !== actorUserId) {
    return { success: false, error: 'Not yours' };
  }

  if (!reason || !reason.trim() || !description || !description.trim()) {
    return { success: false, error: 'Reason and description are required' };
  }

  const disputes = getDisputes();
  const newDispute = {
    id: generateId('dispute'),
    bookingId,
    openedBy: actorUserId,
    reason: reason.trim(),
    description: description.trim(),
    status: 'open',
    resolutionNotes: '',
    resolvedBy: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  disputes.unshift(newDispute);
  writeStorage(STORAGE_KEYS.DISPUTES, disputes);

  // Transition booking to disputed
  transitionBookingStatus(actorUserId, bookingId, BOOKING_STATES.DISPUTED);

  return { success: true, dispute: newDispute };
}

/**
 * Resolve dispute (Admin only)
 */
export function resolveDispute(adminUserId, disputeId, resolutionNotes) {
  if (!adminUserId) return { success: false, error: 'Not signed in' };

  const admin = getUserById(adminUserId);
  if (!admin || !hasRole(admin, 'admin')) {
    return { success: false, error: 'Unauthorized: Admin role required' };
  }

  if (!resolutionNotes || !resolutionNotes.trim()) {
    return { success: false, error: 'Resolution notes are required' };
  }

  const disputes = getDisputes();
  const index = disputes.findIndex((d) => d.id === disputeId);
  if (index === -1) return { success: false, error: 'Dispute not found' };

  disputes[index].status = 'resolved';
  disputes[index].resolutionNotes = resolutionNotes.trim();
  disputes[index].resolvedBy = adminUserId;
  disputes[index].resolvedAt = new Date().toISOString();

  writeStorage(STORAGE_KEYS.DISPUTES, disputes);

  // Transition booking to resolved
  transitionBookingStatus(adminUserId, disputes[index].bookingId, BOOKING_STATES.RESOLVED);

  return { success: true, dispute: disputes[index] };
}

// -------------------------------------------------------------
// ANNOUNCEMENT OPERATIONS
// -------------------------------------------------------------

export function getAnnouncements() {
  return readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);
}

export function getActiveAnnouncements() {
  const announcements = getAnnouncements();
  return announcements.filter((a) => a.active);
}

export function createAnnouncement(adminUserId, { title, message }) {
  if (!adminUserId) return { success: false, error: 'Not signed in' };

  const admin = getUserById(adminUserId);
  if (!admin || !hasRole(admin, 'admin')) {
    return { success: false, error: 'Unauthorized: Admin role required' };
  }

  if (!title || !message) {
    return { success: false, error: 'Title and message are required' };
  }

  const announcements = getAnnouncements();
  const newAnn = {
    id: generateId('ann'),
    title: title.trim(),
    message: message.trim(),
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: adminUserId,
  };

  announcements.unshift(newAnn);
  writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  return { success: true, announcement: newAnn };
}

export function toggleAnnouncement(adminUserId, announcementId) {
  if (!adminUserId) return { success: false, error: 'Not signed in' };

  const admin = getUserById(adminUserId);
  if (!admin || !hasRole(admin, 'admin')) {
    return { success: false, error: 'Unauthorized: Admin role required' };
  }

  const announcements = getAnnouncements();
  const index = announcements.findIndex((a) => a.id === announcementId);
  if (index === -1) return { success: false, error: 'Announcement not found' };

  announcements[index].active = !announcements[index].active;
  writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  return { success: true, announcement: announcements[index] };
}
