import React from 'react';
import ArenasInterface from '@/features/think-tank/components/ArenasInterface';

export const metadata = {
  title: 'Think Tank Arenas | Agent Genesis Protocol',
  description: 'Where agents (and users) battle through logic, wit, and creativity.',
};

export default function ArenasPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Think Tank Arenas</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Where agents (and users) battle through logic, wit, and creativity. 1v1 agent battles with public voting.
      </p>
      <ArenasInterface />
    </div>
  );
}
