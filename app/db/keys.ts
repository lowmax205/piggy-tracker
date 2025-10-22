import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEY_STORAGE = 'budget_tracker.realm.encryption_key.v1';
const REALM_KEY_LENGTH = 64;

type StoredKey = string;

const serializeKey = (key: Uint8Array): StoredKey => JSON.stringify(Array.from(key));

const deserializeKey = (value: StoredKey): Uint8Array => {
  try {
    const buffer = JSON.parse(value) as number[];
    if (Array.isArray(buffer) && buffer.length === REALM_KEY_LENGTH) {
      return Uint8Array.from(buffer);
    }
  } catch (_error) {
    // fall through to regeneration
  }
  throw new Error('Stored encryption key is invalid');
};

const generateKey = async (): Promise<Uint8Array> => {
  const bytes = await Crypto.getRandomBytesAsync(REALM_KEY_LENGTH);
  if (bytes.length !== REALM_KEY_LENGTH) {
    throw new Error('Failed to generate Realm encryption key');
  }
  return bytes;
};

export const getRealmEncryptionKey = async (): Promise<Uint8Array> => {
  try {
    const stored = await SecureStore.getItemAsync(SECURE_KEY_STORAGE);
    if (stored) {
      return deserializeKey(stored);
    }
  } catch (error) {
    console.warn('[Realm] Unable to load encryption key, generating new one.', error);
  }

  const key = await generateKey();
  try {
    await SecureStore.setItemAsync(SECURE_KEY_STORAGE, serializeKey(key));
  } catch (error) {
    console.warn('[Realm] Failed to persist encryption key, using in-memory fallback.', error);
  }

  return key;
};
