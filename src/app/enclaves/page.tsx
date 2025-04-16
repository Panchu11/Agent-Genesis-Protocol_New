import React from 'react';
import EnclavesInterface from '@/features/secure-enclaves/components/EnclavesInterface';

export const metadata = {
  title: 'Secure Agent Enclaves | Agent Genesis Protocol',
  description: 'Encrypted local mode for private conversations or memory. Secure spaces for sensitive agent interactions.',
};

export default function EnclavesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Secure Agent Enclaves</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Encrypted local mode for private conversations or memory. Secure spaces for sensitive agent interactions.
      </p>
      <EnclavesInterface />
    </div>
  );
}
