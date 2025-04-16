'use client';

/**
 * Agent Genesis Protocol - Points Service
 * 
 * This service manages the points system, including transactions,
 * achievements, and streaks.
 */

import { v4 as uuidv4 } from 'uuid';
import db from './db.service';
import { 
  PointsTransaction, 
  PointsTransactionType, 
  Achievement, 
  User 
} from '../types';

/**
 * Add points to a user's account
 */
export const addPoints = async (
  userId: string,
  amount: number,
  type: PointsTransactionType,
  description: string,
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<PointsTransaction> => {
  try {
    // Create the transaction
    const transaction: PointsTransaction = {
      id: uuidv4(),
      userId,
      amount,
      type,
      description,
      timestamp: Date.now(),
      relatedEntityId,
      relatedEntityType
    };
    
    // Add the transaction to the database
    await db.pointsTransactions.add(transaction);
    
    // Update the user's points
    await db.users.where('id').equals(userId).modify(user => {
      user.points += amount;
    });
    
    // Check for achievements
    await checkAchievements(userId, type, relatedEntityId);
    
    return transaction;
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

/**
 * Get a user's points balance
 */
export const getPointsBalance = async (userId: string): Promise<number> => {
  try {
    const user = await db.users.get(userId);
    return user?.points || 0;
  } catch (error) {
    console.error('Error getting points balance:', error);
    throw error;
  }
};

/**
 * Get a user's points transactions
 */
export const getPointsTransactions = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PointsTransaction[]> => {
  try {
    return await db.pointsTransactions
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('timestamp');
  } catch (error) {
    console.error('Error getting points transactions:', error);
    throw error;
  }
};

/**
 * Check for achievements based on user actions
 */
const checkAchievements = async (
  userId: string,
  transactionType: PointsTransactionType,
  relatedEntityId?: string
): Promise<void> => {
  try {
    // Get the user's achievements
    const achievements = await db.achievements.toArray();
    const user = await db.users.get(userId);
    
    if (!user) return;
    
    // Check for specific achievements based on transaction type
    switch (transactionType) {
      case PointsTransactionType.AGENT_CREATION:
        await updateAchievementProgress(userId, 'first-agent', 1);
        break;
        
      case PointsTransactionType.CONVERSATION:
        await updateAchievementProgress(userId, 'conversation-starter', 1);
        break;
        
      case PointsTransactionType.FEED_POST:
        await updateAchievementProgress(userId, 'social-butterfly', 1);
        break;
        
      // Add more achievement checks for other transaction types
    }
    
    // Check for streak-based achievements
    const today = new Date();
    const lastLogin = new Date(user.lastLoginAt);
    
    // Check if the last login was yesterday
    const isConsecutiveDay = 
      today.getDate() - lastLogin.getDate() === 1 || 
      (today.getDate() === 1 && lastLogin.getDate() === new Date(lastLogin.getFullYear(), lastLogin.getMonth() + 1, 0).getDate());
    
    if (isConsecutiveDay) {
      // Update the user's streak
      await db.users.update(userId, {
        streak: user.streak + 1,
        lastLoginAt: Date.now()
      });
      
      // Add streak points
      if (user.streak + 1 >= 1) {
        await addPoints(
          userId,
          10 * (user.streak + 1), // Points increase with streak length
          PointsTransactionType.DAILY_STREAK,
          `Daily streak: ${user.streak + 1} days`
        );
      }
    } else if (today.getDate() !== lastLogin.getDate()) {
      // Reset the streak if not consecutive and not the same day
      await db.users.update(userId, {
        streak: 1,
        lastLoginAt: Date.now()
      });
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

/**
 * Update achievement progress
 */
const updateAchievementProgress = async (
  userId: string,
  achievementId: string,
  increment: number
): Promise<void> => {
  try {
    // Get the achievement
    const achievement = await db.achievements.get(achievementId);
    
    if (!achievement) return;
    
    // Update the progress
    const newProgress = Math.min(achievement.progress + increment, achievement.maxProgress);
    await db.achievements.update(achievementId, { progress: newProgress });
    
    // Check if the achievement is completed
    if (newProgress >= achievement.maxProgress && !achievement.unlockedAt) {
      // Mark the achievement as unlocked
      await db.achievements.update(achievementId, { unlockedAt: Date.now() });
      
      // Award points for the achievement
      await addPoints(
        userId,
        achievement.pointsReward,
        PointsTransactionType.ACHIEVEMENT,
        `Achievement unlocked: ${achievement.name}`,
        achievementId,
        'achievement'
      );
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error);
  }
};

export default {
  addPoints,
  getPointsBalance,
  getPointsTransactions
};
