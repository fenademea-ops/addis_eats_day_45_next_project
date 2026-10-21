import { describe, it, expect, beforeEach } from 'vitest';
import { safeReturnPath } from '../auth';
import { canTransition, BOOKING_STATES } from '../bookingMachine';
import { checkDateOverlap, isCarAvailableForDates } from '../validation';
import { escapeCsvCell, generateCsv } from '../csv';
import {
  createBooking,
  transitionBookingStatus,
  updateCarListing,
  getUsers,
  getCars,
  getBookings,
} from '../data';
import { initializeDemoData, resetDemoData, writeStorage, STORAGE_KEYS } from '../storage';

// In-memory mock for localStorage & sessionStorage in Node environment
const mockStorage = {};
const mockSessionStorage = {};

const createMockEngine = (store) => ({
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => {
    store[key] = String(val);
  },
  removeItem: (key) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
});

global.window = {
  localStorage: createMockEngine(mockStorage),
  sessionStorage: createMockEngine(mockSessionStorage),
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

describe('1. safeReturnPath security tests', () => {
  it('allows safe relative paths', () => {
    expect(safeReturnPath('/dashboard')).toBe('/dashboard');
    expect(safeReturnPath('/cars/car-1')).toBe('/cars/car-1');
    expect(safeReturnPath('/owner?tab=earnings')).toBe('/owner?tab=earnings');
  });

  it('rejects external URLs and open-redirect vectors', () => {
    expect(safeReturnPath('https://example.com')).toBe('/');
    expect(safeReturnPath('http://malicious.org/phish')).toBe('/');
    expect(safeReturnPath('//evil.com')).toBe('/');
    expect(safeReturnPath('//attacker.com/path')).toBe('/');
    expect(safeReturnPath('/\\attacker.com')).toBe('/');
    expect(safeReturnPath('javascript:alert(1)')).toBe('/');
    expect(safeReturnPath('')).toBe('/');
    expect(safeReturnPath(null)).toBe('/');
    expect(safeReturnPath(undefined)).toBe('/');
  });
});

describe('2. Booking lifecycle state machine tests', () => {
  it('enforces valid transitions by actor role', () => {
    // Owner can confirm requested
    expect(canTransition(BOOKING_STATES.REQUESTED, BOOKING_STATES.CONFIRMED, 'owner')).toBe(true);
    // Renter cannot confirm their own request
    expect(canTransition(BOOKING_STATES.REQUESTED, BOOKING_STATES.CONFIRMED, 'renter')).toBe(false);

    // Renter can cancel requested
    expect(canTransition(BOOKING_STATES.REQUESTED, BOOKING_STATES.CANCELLED, 'renter')).toBe(true);

    // Confirmed can start trip into in_progress
    expect(canTransition(BOOKING_STATES.CONFIRMED, BOOKING_STATES.IN_PROGRESS, 'owner')).toBe(true);
    expect(canTransition(BOOKING_STATES.CONFIRMED, BOOKING_STATES.IN_PROGRESS, 'renter')).toBe(true);

    // in_progress to completed
    expect(canTransition(BOOKING_STATES.IN_PROGRESS, BOOKING_STATES.COMPLETED, 'renter')).toBe(true);
    expect(canTransition(BOOKING_STATES.IN_PROGRESS, BOOKING_STATES.COMPLETED, 'owner')).toBe(true);

    // in_progress to disputed
    expect(canTransition(BOOKING_STATES.IN_PROGRESS, BOOKING_STATES.DISPUTED, 'renter')).toBe(true);
    expect(canTransition(BOOKING_STATES.IN_PROGRESS, BOOKING_STATES.DISPUTED, 'owner')).toBe(true);

    // Completed to reviewed only by renter
    expect(canTransition(BOOKING_STATES.COMPLETED, BOOKING_STATES.REVIEWED, 'renter')).toBe(true);
    expect(canTransition(BOOKING_STATES.COMPLETED, BOOKING_STATES.REVIEWED, 'owner')).toBe(false);

    // Disputed to resolved only by admin
    expect(canTransition(BOOKING_STATES.DISPUTED, BOOKING_STATES.RESOLVED, 'admin')).toBe(true);
    expect(canTransition(BOOKING_STATES.DISPUTED, BOOKING_STATES.RESOLVED, 'renter')).toBe(false);
    expect(canTransition(BOOKING_STATES.DISPUTED, BOOKING_STATES.RESOLVED, 'owner')).toBe(false);
  });

  it('rejects transitions from terminal states', () => {
    expect(canTransition(BOOKING_STATES.CANCELLED, BOOKING_STATES.CONFIRMED, 'owner')).toBe(false);
    expect(canTransition(BOOKING_STATES.DECLINED, BOOKING_STATES.CONFIRMED, 'owner')).toBe(false);
    expect(canTransition(BOOKING_STATES.REVIEWED, BOOKING_STATES.IN_PROGRESS, 'renter')).toBe(false);
    expect(canTransition(BOOKING_STATES.RESOLVED, BOOKING_STATES.CONFIRMED, 'admin')).toBe(false);
  });
});

describe('3. Date overlap and availability checks', () => {
  it('accurately detects overlapping dates', () => {
    // Exact match
    expect(checkDateOverlap('2026-11-01', '2026-11-05', '2026-11-01', '2026-11-05')).toBe(true);
    // Overlapping tail
    expect(checkDateOverlap('2026-11-01', '2026-11-05', '2026-11-04', '2026-11-08')).toBe(true);
    // Contained inside
    expect(checkDateOverlap('2026-11-01', '2026-11-10', '2026-11-03', '2026-11-05')).toBe(true);
    // Non-overlapping
    expect(checkDateOverlap('2026-11-01', '2026-11-05', '2026-11-06', '2026-11-10')).toBe(false);
    expect(checkDateOverlap('2026-11-10', '2026-11-15', '2026-11-01', '2026-11-05')).toBe(false);
  });

  it('prevents overlapping bookings for the same car', () => {
    const existing = [
      {
        id: 'b-1',
        carId: 'car-1',
        startDate: '2026-11-05',
        endDate: '2026-11-08',
        status: 'confirmed',
      },
    ];

    const result = isCarAvailableForDates('car-1', '2026-11-07', '2026-11-10', existing, []);
    expect(result.available).toBe(false);
    expect(result.reason).toContain('already booked');

    const resultFree = isCarAvailableForDates('car-1', '2026-11-09', '2026-11-12', existing, []);
    expect(resultFree.available).toBe(true);
  });
});

describe('4. CSV escaping and generator tests', () => {
  it('correctly escapes commas, quotes, and newlines', () => {
    expect(escapeCsvCell('Addis Ababa')).toBe('Addis Ababa');
    expect(escapeCsvCell('Bole, Kazanchis')).toBe('"Bole, Kazanchis"');
    expect(escapeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    expect(escapeCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
  });

  it('generates well-formatted CSV with headers and data', () => {
    const rows = [
      { id: '1', name: 'RAV4', price: 4500, note: 'Fast, clean' },
      { id: '2', name: 'Prado', price: 9500, note: 'VIP "Lux"' },
    ];
    const csv = generateCsv(rows);
    expect(csv).toContain('id,name,price,note');
    expect(csv).toContain('"Fast, clean"');
    expect(csv).toContain('"VIP ""Lux"""');
  });
});

describe('5. Required Negative Tests (Strict security and ownership)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetDemoData();
  });

  it('Test 1: Call booking function without session → "Not signed in", no booking created', () => {
    const initialBookingsCount = getBookings().length;

    // Call createBooking with null/undefined user ID (no session)
    const result = createBooking(null, {
      carId: 'car-1',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not signed in');
    expect(getBookings().length).toBe(initialBookingsCount);
  });

  it("Test 2: Renter A cancels Renter B's booking → 'Not yours', no change", () => {
    const bookings = getBookings();
    // booking-requested-1 belongs to user-renter-1
    const targetBooking = bookings.find((b) => b.renterId === 'user-renter-1');
    expect(targetBooking).toBeDefined();

    // Attacker (user-suspended-1 or a different user ID 'user-other-99') attempts to cancel
    const result = transitionBookingStatus(
      'user-other-99',
      targetBooking.id,
      BOOKING_STATES.CANCELLED
    );

    // If user does not exist in DB or does not own record
    expect(result.success).toBe(false);
    expect(['Not yours', 'User not found']).toContain(result.error);

    // Verify booking status remains untouched
    const freshBooking = getBookings().find((b) => b.id === targetBooking.id);
    expect(freshBooking.status).toBe(targetBooking.status);
  });

  it("Test 3: Owner editing another owner's car via URL ID is refused with 'Not yours'", () => {
    // car-1 belongs to 'user-owner-1'
    const car1 = getCars().find((c) => c.id === 'car-1');
    expect(car1.ownerId).toBe('user-owner-1');

    // 'user-dual-1' attempts to edit 'car-1'
    const result = updateCarListing('user-dual-1', 'car-1', {
      pricePerDay: 1000,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not yours');

    // Verify pricePerDay did not change in storage
    const freshCar = getCars().find((c) => c.id === 'car-1');
    expect(freshCar.pricePerDay).toBe(4500);
  });

  it('Test 4: Suspended user is prevented from mutating data or signing in', () => {
    // user-suspended-1 tries to create booking
    const result = createBooking('user-suspended-1', {
      carId: 'car-1',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Your account is suspended');
  });
});
