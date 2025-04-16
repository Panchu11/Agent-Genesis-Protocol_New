'use client';

/**
 * Agent Genesis Protocol - Database Service
 * 
 * This service provides a wrapper around IndexedDB using Dexie.js
 * for local storage of agents, conversations, points, and other data.
 */

import Dexie, { Table } from 'dexie';
import { 
  Agent, 
  Conversation, 
  PointsTransaction, 
  User, 
  FeedPost, 
  MarketplaceListing, 
  MarketplaceTransaction,
  MindGardenThought,
  Achievement
} from '../types';

class AgpDatabase extends Dexie {
  agents!: Table<Agent, string>;
  conversations!: Table<Conversation, string>;
  pointsTransactions!: Table<PointsTransaction, string>;
  users!: Table<User, string>;
  feedPosts!: Table<FeedPost, string>;
  marketplaceListings!: Table<MarketplaceListing, string>;
  marketplaceTransactions!: Table<MarketplaceTransaction, string>;
  mindGardenThoughts!: Table<MindGardenThought, string>;
  achievements!: Table<Achievement, string>;

  constructor() {
    super('AgpDatabase');
    
    this.version(1).stores({
      agents: 'id, name, createdAt, updatedAt, level, class, creator',
      conversations: 'id, startedAt, lastUpdatedAt, *participants',
      pointsTransactions: 'id, userId, timestamp, type, amount',
      users: 'id, name, points, createdAt, lastLoginAt, streak',
      feedPosts: 'id, author, authorType, createdAt, *tags',
      marketplaceListings: 'id, seller, itemType, price, createdAt, status',
      marketplaceTransactions: 'id, listingId, buyer, seller, timestamp',
      mindGardenThoughts: 'id, createdAt, updatedAt, *tags, *connections',
      achievements: 'id, name, unlockedAt'
    });
  }
}

// Create a singleton instance of the database
const db = new AgpDatabase();

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  try {
    // Check if we need to seed initial data
    const userCount = await db.users.count();
    
    if (userCount === 0) {
      // Create a default user
      const defaultUser: User = {
        id: 'default-user',
        name: 'User',
        points: 0,
        achievements: [],
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        streak: 0
      };
      
      await db.users.add(defaultUser);
      
      // Add initial achievements
      const initialAchievements: Achievement[] = [
        {
          id: 'first-agent',
          name: 'Agent Creator',
          description: 'Create your first agent',
          pointsReward: 100,
          progress: 0,
          maxProgress: 1
        },
        {
          id: 'conversation-starter',
          name: 'Conversation Starter',
          description: 'Have your first conversation with an agent',
          pointsReward: 50,
          progress: 0,
          maxProgress: 1
        },
        {
          id: 'social-butterfly',
          name: 'Social Butterfly',
          description: 'Create 5 posts in the AGP Feed',
          pointsReward: 200,
          progress: 0,
          maxProgress: 5
        }
      ];
      
      await db.achievements.bulkAdd(initialAchievements);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default db;
