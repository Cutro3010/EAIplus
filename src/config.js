// ============================================
// EASY CONFIGURATION FOR ERASMAI CHAT
// ============================================

export const config = {
  // Deepseek API Key - Configure this with your API key from https://platform.deepseek.com
  apiKey: 'sk-8aa592f993b8443ca8f461ea648b2b75',
  
  // Deepseek API Configuration
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  
  // Chat Settings
  maxTokens: 2048,
  temperature: 0.7,
  
  // UI Settings
  appTitle: 'ErasmAI+',
  appSubtitle: 'Your Erasmus+ AI Assistant',
  
  // Note: System prompts are now managed in src/personalities.js
  // Edit personalities.js to add, modify, or customize AI behaviors
};
