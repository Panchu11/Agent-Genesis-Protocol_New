import React from 'react';
import AgentBuilderInterface from '@/features/agent-builder/components/AgentBuilderInterface';

export const metadata = {
  title: 'AGP Agent Builder | Agent Genesis Protocol',
  description: 'Create production-grade agents with complex logic, goals, and tools.',
};

export default function BuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AGP Agent Builder</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Create production-grade agents with complex logic, goals, and tools. Build advanced autonomous agents with custom workflows.
      </p>
      <AgentBuilderInterface />
    </div>
  );
}
