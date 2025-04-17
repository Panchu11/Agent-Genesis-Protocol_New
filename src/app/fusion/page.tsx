import React from 'react';
import RealityFusionInterface from '@/features/reality-fusion/components/RealityFusionInterface';

export const metadata = {
  title: 'Reality Fusion | Agent Genesis Protocol',
  description: 'Blend local reality (browser tabs, clipboard, documents) into agent cognition.',
};

export default function FusionPage() {
  return (
    <div className=" container mx-auto px-4 py-8\>
 <h1 className=\text-3xl font-bold mb-6\>Reality Fusion</h1>
 <p className=\text-gray-600 dark:text-gray-300 mb-8\>
 Blend local reality (browser tabs, clipboard, documents) into agent cognition. Connect your agents to your digital environment.
 </p>
 <RealityFusionInterface />
 </div>
 );
}
