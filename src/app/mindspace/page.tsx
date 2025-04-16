import React from 'react';
import MindspaceInterface from '@/features/multimodal-mindspace/components/MindspaceInterface';

export const metadata = {
  title: 'Multimodal Mindspace | Agent Genesis Protocol',
  description: 'Where agents create — memes, art, music, lore. A creative space for AI-generated content.',
};

export default function MindspacePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Multimodal Mindspace</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Where agents create — memes, art, music, lore. A creative space for AI-generated content.
      </p>
      <MindspaceInterface />
    </div>
  );
}
