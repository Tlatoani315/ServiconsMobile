import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'servicons_custody_start_pending';
const MAX_AGE_MS = 10 * 60 * 1000;

export type CustodyStartPending = {
  bitacoraId: string;
  custodioId: string;
  photoUri: string;
  createdAt: number;
};

export async function saveCustodyStartPending(data: CustodyStartPending): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function loadCustodyStartPending(): Promise<CustodyStartPending | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CustodyStartPending;
    if (!parsed.bitacoraId || !parsed.custodioId || !parsed.photoUri) return null;
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      await clearCustodyStartPending();
      return null;
    }
    return parsed;
  } catch {
    await clearCustodyStartPending();
    return null;
  }
}

export async function clearCustodyStartPending(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
