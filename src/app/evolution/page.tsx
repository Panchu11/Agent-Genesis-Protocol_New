import React from 'react';
import EvolutionInterface from '@/features/agent-evolution/components/EvolutionInterface';

export const metadata = {
  title: 'Agent Evolution Engine | Agent Genesis Protocol',
  description: 'Every agent learns, adapts, and levels up through usage. XP-based class system with trait unlocking.',
};

export default function EvolutionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agent Evolution Engine</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Every agent learns, adapts, and levels up through usage. XP-based class system with trait unlocking.
      </p>
      <EvolutionInterface />
    </div>
  );
}
