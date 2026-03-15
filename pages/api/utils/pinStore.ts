/** In-memory PIN store with 5-minute expiry */

interface PinEntry {
    pin: string;
    expiresAt: number; // timestamp ms
    purpose: 'register' | 'reset';
}

// Map: email -> PinEntry
// Attach to global to survive Next.js HMR in development
const globalAny: any = global;
if (!globalAny.pinStore) {
    globalAny.pinStore = new Map<string, PinEntry>();
}
const pinStore: Map<string, PinEntry> = globalAny.pinStore;

/** Generate a random 6-digit PIN */
export function generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Store a PIN for an email with 5-minute expiry */
export function storePin(email: string, pin: string, purpose: 'register' | 'reset'): void {
    pinStore.set(email.toLowerCase(), {
        pin,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        purpose,
    });
}

/** Verify a PIN for an email. Returns true if valid, false otherwise. Deletes on success. */
export function verifyPin(email: string, pin: string, purpose: 'register' | 'reset'): boolean {
    const entry = pinStore.get(email.toLowerCase());
    if (!entry) return false;
    if (entry.purpose !== purpose) return false;
    if (Date.now() > entry.expiresAt) {
        pinStore.delete(email.toLowerCase());
        return false; // expired
    }
    if (entry.pin !== pin) return false;

    // Valid — delete it (one-time use)
    pinStore.delete(email.toLowerCase());
    return true;
}

/** Check if a PIN exists (without consuming it) */
export function hasPendingPin(email: string): boolean {
    const entry = pinStore.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
        pinStore.delete(email.toLowerCase());
        return false;
    }
    return true;
}

// Cleanup expired PINs every 2 minutes
if (!globalAny.pinStoreInterval) {
    globalAny.pinStoreInterval = setInterval(() => {
        const now = Date.now();
        for (const [email, entry] of pinStore) {
            if (now > entry.expiresAt) pinStore.delete(email);
        }
    }, 2 * 60 * 1000);
}
