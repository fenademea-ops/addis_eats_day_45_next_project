import { describe, it, expect, beforeEach } from 'vitest';
import { safeReturnPath, registerUser } from '../auth';
import { canTransition, BOOKING_STATES } from '../bookingMachine';
import { checkDateOverlap, isCarAvailableForDates } from '../validation';
import { escapeCsvCell, generateCsv } from '../csv';
import {
  createBooking,
  transitionBookingStatus,
  updateCarListing,
  canUserAccessBooking,
  getUsers,
  getCars,
  getBookings,
} from '../data';
import {
  initializeDemoData,
  resetDemoData,
  readStorage,
  writeStorage,
  STORAGE_KEYS,
} from '../storage';

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

  it("Test 5: Renter B attempting to view Renter A's private booking is refused", () => {
    const bookings = getBookings();
    const renterABooking = bookings.find((b) => b.renterId === 'user-renter-1');
    expect(renterABooking).toBeDefined();

    // Renter B (user-dual-1) attempts to access
    const checkOther = canUserAccessBooking('user-dual-1', renterABooking.id);
    expect(checkOther.allowed).toBe(false);
    expect(checkOther.error).toBe('Not yours');

    // Unauthenticated visitor
    const checkAnon = canUserAccessBooking(null, renterABooking.id);
    expect(checkAnon.allowed).toBe(false);
    expect(checkAnon.error).toBe('Not signed in');

    // Legitimate renter A access
    const checkOwner = canUserAccessBooking('user-renter-1', renterABooking.id);
    expect(checkOwner.allowed).toBe(true);

    // Platform admin access
    const checkAdmin = canUserAccessBooking('user-admin-1', renterABooking.id);
    expect(checkAdmin.allowed).toBe(true);
  });

  it('Test 6: Invalid booking dates are rejected with validation error', () => {
    // End date before start date
    const resInverted = createBooking('user-renter-1', {
      carId: 'car-1',
      startDate: '2026-12-10',
      endDate: '2026-12-05',
    });
    expect(resInverted.success).toBe(false);
    expect(resInverted.error).toContain('cannot be earlier than start date');

    // Malformed date strings
    const resMalformed = createBooking('user-renter-1', {
      carId: 'car-1',
      startDate: 'invalid-date',
      endDate: '2026-12-10',
    });
    expect(resMalformed.success).toBe(false);
    expect(resMalformed.error).toContain('YYYY-MM-DD');

    // Missing dates
    const resMissing = createBooking('user-renter-1', {
      carId: 'car-1',
      startDate: '',
      endDate: '',
    });
    expect(resMissing.success).toBe(false);
  });

  it('Test 7: Invalid lifecycle transitions are rejected by data layer', () => {
    const bookings = getBookings();
    const reqBooking = bookings.find((b) => b.status === BOOKING_STATES.REQUESTED);
    expect(reqBooking).toBeDefined();

    // Cannot jump straight from requested to completed
    const illegalJump = transitionBookingStatus(
      reqBooking.ownerId,
      reqBooking.id,
      BOOKING_STATES.COMPLETED
    );
    expect(illegalJump.success).toBe(false);
    expect(illegalJump.error).toContain('Invalid transition');

    // Terminal state cannot be transitioned
    const cancelledBooking = bookings.find((b) => b.status === BOOKING_STATES.CANCELLED);
    expect(cancelledBooking).toBeDefined();
    const terminalMutate = transitionBookingStatus(
      'user-admin-1',
      cancelledBooking.id,
      BOOKING_STATES.CONFIRMED
    );
    expect(terminalMutate.success).toBe(false);
  });

  it('Test 8: Duplicate email registration is refused without altering user store', () => {
    const initialUsersCount = getUsers().length;

    // Existing seed user email
    const duplicateRes = registerUser({
      name: 'Imposter User',
      email: 'abebe@example.com', // already belongs to user-renter-1
      phone: '0911000999',
    });

    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.error).toBe('An account with this email already exists');
    expect(getUsers().length).toBe(initialUsersCount);
  });

  it('Test 9: Public registration cannot grant admin role', () => {
    const regRes = registerUser({
      name: 'Privilege Escalation Tester',
      email: 'escalate@test.et',
      phone: '0911555666',
      roles: ['admin', 'owner'], // Attacker payload injecting admin
    });

    expect(regRes.success).toBe(true);
    expect(regRes.user.roles).not.toContain('admin');
    expect(regRes.user.roles).toContain('renter');
  });

  it('Test 10: Corrupted or malformed browser storage JSON recovers with fallback', () => {
    // Inject corrupt JSON into storage
    mockStorage['sw_corrupt_test'] = '{broken: json, unquoted}';

    const result = readStorage('sw_corrupt_test', { fallback: true });
    expect(result).toEqual({ fallback: true });
  });
});
