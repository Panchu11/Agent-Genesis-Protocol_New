/**
 * Agent Genesis Protocol - LLM Service
 * 
 * This service provides integration with the Fireworks API for Dobby-Unhinged-LLaMA-3.3-70B
 */

import axios from 'axios';
import { LLMRequest, LLMResponse } from '../types';

// Constants
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/completions';
const FIREWORKS_API_KEY = process.env.NEXT_PUBLIC_FIREWORKS_API_KEY || 'fw_3ZN3Es5mT79GXi3iX5RPpfwL';
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_FIREWORKS_MODEL_ID || 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new';

/**
 * Generate a completion using the Fireworks API
 */
export const generateCompletion = async (request: LLMRequest): Promise<LLMResponse> => {
  try {
    const response = await axios.post(
      FIREWORKS_API_URL,
      {
        model: request.model || DEFAULT_MODEL,
        prompt: request.prompt,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1024,
        top_p: request.topP || 0.9,
        frequency_penalty: request.frequencyPenalty || 0,
        presence_penalty: request.presencePenalty || 0,
        stop: request.stop || [],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIREWORKS_API_KEY}`
        }
      }
    );

    return {
      text: response.data.choices[0].text,
      usage: {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens
      }
    };
  } catch (error) {
    console.error('Error generating completion:', error);
    throw error;
  }
};

/**
 * Generate a streaming completion using the Fireworks API
 */
export const generateStreamingCompletion = async (
  request: LLMRequest,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: any) => void
): Promise<void> => {
  try {
    const response = await axios.post(
      FIREWORKS_API_URL,
      {
        model: request.model || DEFAULT_MODEL,
        prompt: request.prompt,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1024,
        top_p: request.topP || 0.9,
        frequency_penalty: request.frequencyPenalty || 0,
        presence_penalty: request.presencePenalty || 0,
        stop: request.stop || [],
        stream: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIREWORKS_API_KEY}`
        },
        responseType: 'stream'
      }
    );

    let fullResponse = '';

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            onComplete(fullResponse);
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices[0]?.text || '';
            
            if (text) {
              fullResponse += text;
              onChunk(text);
            }
          } catch (e) {
            console.error('Error parsing streaming response:', e);
          }
        }
      }
    });

    response.data.on('end', () => {
      onComplete(fullResponse);
    });

    response.data.on('error', (err: any) => {
      onError(err);
    });
  } catch (error) {
    onError(error);
  }
};

/**
 * Generate a system prompt for the Dobby-Unhinged model
 */
export const generateSystemPrompt = (context: string): string => {
  return `You are AGP (Agent Genesis Protocol), an AI assistant powered by Dobby-Unhinged-LLaMA-3.3-70B.
  
You were created by Panchu as part of the Agent Genesis Protocol project.

${context}

Please provide helpful, creative, and thoughtful responses while staying on topic.
Do not simulate both sides of a conversation or continue without user input.
`;
};

export default {
  generateCompletion,
  generateStreamingCompletion,
  generateSystemPrompt
};
