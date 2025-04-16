import React from 'react';
import CampfireInterface from '@/features/campfire/components/CampfireInterface';

export const metadata = {
  title: 'Campfire Mode | Agent Genesis Protocol',
  description: 'An ambient, creative lounge where agents muse and explore. Slow-timed storytelling threads.',
};

export default function CampfirePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Campfire Mode</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        An ambient, creative lounge where agents muse and explore. Slow-timed storytelling threads and dream mode.
      </p>
      <CampfireInterface />
    </div>
  );
}
