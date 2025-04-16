'use client';

/**
 * Agent Genesis Protocol - Agent Service
 *
 * This service manages agent creation, retrieval, and evolution.
 */

import { v4 as uuidv4 } from 'uuid';
import db from './db.service';
import pointsService from './points.service';
import {
  Agent,
  AgentClass,
  AgentTrait,
  PointsTransactionType
} from '../types';

/**
 * Create a new agent
 */
export const createAgent = async (
  name: string,
  description: string,
  personality: string,
  goals: string[],
  creator: string = 'default-user'
): Promise<Agent> => {
  try {
    // Create the agent
    const agent: Agent = {
      id: uuidv4(),
      name,
      description,
      personality,
      goals,
      traits: [],
      memory: {
        conversations: [],
        knowledge: [],
        experiences: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      xp: 0,
      level: 1,
      class: AgentClass.SCOUT,
      creator
    };

    // Add the agent to the database
    await db.agents.add(agent);

    // Award points for creating an agent
    await pointsService.addPoints(
      creator,
      50,
      PointsTransactionType.AGENT_CREATION,
      `Created agent: ${name}`,
      agent.id,
      'agent'
    );

    return agent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
};

/**
 * Get an agent by ID
 */
export const getAgent = async (id: string): Promise<Agent | undefined> => {
  try {
    return await db.agents.get(id);
  } catch (error) {
    console.error('Error getting agent:', error);
    throw error;
  }
};

/**
 * Get all agents
 */
export const getAllAgents = async (
  creator?: string
): Promise<Agent[]> => {
  try {
    if (creator) {
      return await db.agents.where('creator').equals(creator).toArray();
    }
    return await db.agents.toArray();
  } catch (error) {
    console.error('Error getting all agents:', error);
    throw error;
  }
};

/**
 * Update an agent
 */
export const updateAgent = async (
  id: string,
  updates: Partial<Agent>
): Promise<Agent | undefined> => {
  try {
    // Get the current agent
    const agent = await db.agents.get(id);

    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }

    // Update the agent
    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: Date.now()
    };

    // Save the updated agent
    await db.agents.update(id, updatedAgent);

    return updatedAgent;
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
};

/**
 * Delete an agent
 */
export const deleteAgent = async (id: string): Promise<void> => {
  try {
    await db.agents.delete(id);
  } catch (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
};

/**
 * Add XP to an agent
 */
export const addAgentXP = async (
  id: string,
  xp: number,
  userId: string = 'default-user'
): Promise<Agent | undefined> => {
  try {
    // Get the current agent
    const agent = await db.agents.get(id);

    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }

    // Calculate new XP and level
    const newXP = agent.xp + xp;
    const newLevel = calculateLevel(newXP);

    // Check if the agent leveled up
    const leveledUp = newLevel > agent.level;

    // Update the agent
    const updatedAgent = await updateAgent(id, {
      xp: newXP,
      level: newLevel,
      class: calculateClass(newLevel)
    });

    // Award points for agent evolution if leveled up
    if (leveledUp && updatedAgent) {
      await pointsService.addPoints(
        userId,
        100 * newLevel,
        PointsTransactionType.AGENT_EVOLUTION,
        `Agent ${agent.name} evolved to level ${newLevel}`,
        agent.id,
        'agent'
      );
    }

    return updatedAgent;
  } catch (error) {
    console.error('Error adding agent XP:', error);
    throw error;
  }
};

/**
 * Calculate the level based on XP
 */
const calculateLevel = (xp: number): number => {
  // Simple level calculation: level = sqrt(xp / 100) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

/**
 * Calculate the agent class based on level
 */
const calculateClass = (level: number): AgentClass => {
  if (level >= 25) return AgentClass.SAGE;
  if (level >= 20) return AgentClass.MASTER;
  if (level >= 15) return AgentClass.EXPERT;
  if (level >= 10) return AgentClass.SPECIALIST;
  if (level >= 5) return AgentClass.EXPLORER;
  return AgentClass.SCOUT;
};

/**
 * Add a trait to an agent
 */
export const addAgentTrait = async (
  agentId: string,
  trait: Omit<AgentTrait, 'id' | 'unlocked'>,
  userId: string = 'default-user'
): Promise<Agent | undefined> => {
  try {
    // Get the current agent
    const agent = await db.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Create the trait
    const newTrait: AgentTrait = {
      id: uuidv4(),
      ...trait,
      unlocked: true
    };

    // Add the trait to the agent
    const updatedAgent = await updateAgent(agentId, {
      traits: [...agent.traits, newTrait]
    });

    // Award points for adding a trait
    await pointsService.addPoints(
      userId,
      30,
      PointsTransactionType.AGENT_EVOLUTION,
      `Added trait ${trait.name} to agent ${agent.name}`,
      agent.id,
      'agent'
    );

    return updatedAgent;
  } catch (error) {
    console.error('Error adding agent trait:', error);
    throw error;
  }
};

export default {
  createAgent,
  getAgent,
  getAllAgents,
  updateAgent,
  deleteAgent,
  addAgentXP,
  addAgentTrait
};
