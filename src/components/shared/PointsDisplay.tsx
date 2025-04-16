'use client';

import React from 'react';
import { FiAward } from 'react-icons/fi';
import { useUser } from '@/contexts/UserContext';

interface PointsDisplayProps {
  className?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ className = '' }) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-6 w-16 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <FiAward className="text-yellow-500 mr-1" />
      <span className="font-semibold">{user?.points || 0} points</span>
    </div>
  );
};

export default PointsDisplay;
