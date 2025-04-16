/**
 * Agent Genesis Protocol - Type Definitions
 */

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  personality: string;
  goals: string[];
  traits: AgentTrait[];
  memory: AgentMemory;
  createdAt: number;
  updatedAt: number;
  xp: number;
  level: number;
  class: AgentClass;
  creator: string;
}

export interface AgentTrait {
  id: string;
  name: string;
  description: string;
  effect: string;
  unlocked: boolean;
}

export interface AgentMemory {
  conversations: Conversation[];
  knowledge: KnowledgeItem[];
  experiences: Experience[];
}

export interface Conversation {
  id: string;
  messages: Message[];
  participants: string[];
  startedAt: number;
  lastUpdatedAt: number;
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  type: 'text' | 'image' | 'audio' | 'system';
}

export interface KnowledgeItem {
  id: string;
  content: string;
  source: string;
  tags: string[];
  createdAt: number;
}

export interface Experience {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

export enum AgentClass {
  SCOUT = 'Scout',
  EXPLORER = 'Explorer',
  SPECIALIST = 'Specialist',
  EXPERT = 'Expert',
  MASTER = 'Master',
  SAGE = 'Sage',
}

// Points System Types
export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: PointsTransactionType;
  description: string;
  timestamp: number;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export enum PointsTransactionType {
  AGENT_CREATION = 'agent_creation',
  AGENT_EVOLUTION = 'agent_evolution',
  CONVERSATION = 'conversation',
  FEED_POST = 'feed_post',
  FEED_REACTION = 'feed_reaction',
  KNOWLEDGE_CREATION = 'knowledge_creation',
  MARKETPLACE_LISTING = 'marketplace_listing',
  MARKETPLACE_PURCHASE = 'marketplace_purchase',
  DAILY_STREAK = 'daily_streak',
  ACHIEVEMENT = 'achievement',
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsReward: number;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
}

// User Types
export interface User {
  id: string;
  name: string;
  points: number;
  achievements: Achievement[];
  createdAt: number;
  lastLoginAt: number;
  streak: number;
}

// LLM Types
export interface LLMRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface LLMResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Feed Types
export interface FeedPost {
  id: string;
  content: string;
  author: string;
  authorType: 'user' | 'agent';
  createdAt: number;
  reactions: Reaction[];
  comments: Comment[];
  tags: string[];
}

export interface Reaction {
  id: string;
  type: string;
  userId: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorType: 'user' | 'agent';
  createdAt: number;
  reactions: Reaction[];
}

// Marketplace Types
export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  itemType: 'agent' | 'template' | 'trait';
  itemId: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'sold' | 'cancelled';
}

export interface MarketplaceTransaction {
  id: string;
  listingId: string;
  buyer: string;
  seller: string;
  price: number;
  timestamp: number;
}

// Mind Garden Types
export interface MindGardenThought {
  id: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  connections: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
