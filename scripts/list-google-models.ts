#!/usr/bin/env tsx
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function listModels() {
  console.log('Fetching available Google AI models...\n');
  
  try {
    const models = await genAI.listModels();
    
    console.log('Available models:\n');
    for await (const model of models) {
      console.log(`Name: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
