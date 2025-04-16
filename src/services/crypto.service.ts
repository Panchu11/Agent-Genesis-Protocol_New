'use client';

/**
 * Agent Genesis Protocol - Crypto Service
 * 
 * This service provides encryption and decryption functionality for secure enclaves
 */

// Generate a random encryption key
export const generateEncryptionKey = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Convert string to ArrayBuffer
const str2ab = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

// Convert ArrayBuffer to string
const ab2str = (buf: ArrayBuffer): string => {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
};

// Derive a key from a password
export const deriveKey = async (password: string, salt: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  
  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data
export const encryptData = async (data: string, password: string): Promise<string> => {
  try {
    // Generate a random salt
    const salt = generateEncryptionKey().slice(0, 16);
    
    // Derive a key from the password
    const key = await deriveKey(password, salt);
    
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine the salt, IV, and encrypted data
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    
    result.set(encoder.encode(salt));
    result.set(iv, salt.length);
    result.set(encryptedArray, salt.length + iv.length);
    
    // Convert to base64
    return btoa(ab2str(result.buffer));
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
};

// Decrypt data
export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
  try {
    // Convert from base64
    const encryptedBuffer = str2ab(atob(encryptedData));
    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    // Extract the salt, IV, and encrypted data
    const encoder = new TextEncoder();
    const salt = new TextDecoder().decode(encryptedArray.slice(0, 16));
    const iv = encryptedArray.slice(16, 28);
    const data = encryptedArray.slice(28);
    
    // Derive the key from the password
    const key = await deriveKey(password, salt);
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Convert the decrypted data to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw error;
  }
};

export default {
  generateEncryptionKey,
  encryptData,
  decryptData
};
