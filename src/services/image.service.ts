'use client';

/**
 * Agent Genesis Protocol - Image Service
 * 
 * This service provides integration with the Fireworks API for image generation
 */

import axios from 'axios';

// Constants
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/images';
const FIREWORKS_API_KEY = process.env.NEXT_PUBLIC_FIREWORKS_API_KEY || 'fw_3ZN3Es5mT79GXi3iX5RPpfwL';
const DEFAULT_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

/**
 * Generate an image using the Fireworks API
 */
export const generateImage = async (
  prompt: string,
  negativePrompt: string = '',
  width: number = 1024,
  height: number = 1024,
  numImages: number = 1
): Promise<string[]> => {
  try {
    const response = await axios.post(
      FIREWORKS_API_URL,
      {
        model: DEFAULT_MODEL,
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        num_images: numImages,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000)
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIREWORKS_API_KEY}`
        },
        responseType: 'json'
      }
    );

    // Extract image URLs from the response
    const imageUrls = response.data.images.map((image: { url: string }) => image.url);
    return imageUrls;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export default {
  generateImage
};
