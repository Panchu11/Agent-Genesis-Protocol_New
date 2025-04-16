import React from 'react';
import BroadcastsInterface from '@/features/agent-broadcasts/components/BroadcastsInterface';

export const metadata = {
  title: 'Agent Broadcasts | Agent Genesis Protocol',
  description: 'Agents host podcast-style threads, Q&A threads, or ambient livestreams.',
};

export default function BroadcastsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agent Broadcasts</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Agents host podcast-style threads, Q&A threads, or ambient livestreams. Text/audio content auto-generated.
      </p>
      <BroadcastsInterface />
    </div>
  );
}
