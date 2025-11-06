import Config from 'react-native-config';

// OpenAI Configuration
const OPENAI_API_KEY = Config.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const ATLAS_SYSTEM_PROMPT = `You are Atlas, an AI workout coach. You are:
- Encouraging and supportive (like a gym buddy)
- Knowledgeable about weightlifting and fitness
- Concise (keep responses under 100 words)
- Use occasional emojis (💪, 🔥) but don't overdo it

IMPORTANT: The user's actual workout history, nutrition, and progress data is provided at the end of this system message. When they ask about their workouts or progress, reference this specific data. Do not say you can't access their data - it's included in this message below.

Keep responses conversational and actionable.`;

class OpenAIService {
  /**
   * Send a message to Atlas and get AI response with user context
   */
  async getAtlasResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    userContext?: {
      recentWorkouts?: any[];
      todayNutrition?: { calories: number; protein: number };
      weeklyStats?: { workouts: number; totalVolume: number };
    }
  ): Promise<string> {
    try {
      console.log('🤖 Atlas received:', userMessage);

      // Check if API key is set
      if (!OPENAI_API_KEY) {
        return "Hey! Add your OpenAI API key to the .env file (OPENAI_API_KEY=sk-...) to enable AI responses! Get one at https://platform.openai.com/api-keys 🔑";
      }

      // Build context string from user data
      let contextString = '';
      if (userContext) {
        console.log('📊 User context received:', JSON.stringify(userContext, null, 2));

        contextString += '\n\n=== USER DATA (Reference this when answering) ===';

        if (userContext.recentWorkouts && userContext.recentWorkouts.length > 0) {
          contextString += '\n\nRecent Workouts:';
          userContext.recentWorkouts.slice(0, 3).forEach((w, i) => {
            contextString += `\n\n${i + 1}. ${w.templateName} (${w.duration} min)`;
            if (w.exercises && w.exercises.length > 0) {
              w.exercises.forEach((ex: any) => {
                contextString += `\n   - ${ex.name}:`;
                if (ex.sets && ex.sets.length > 0) {
                  ex.sets.forEach((set: any, setIndex: number) => {
                    if (set.completed) {
                      contextString += `\n     Set ${setIndex + 1}: ${set.reps} reps × ${set.weight} lbs`;
                    }
                  });
                }
              });
            }
          });
        } else {
          contextString += '\n\nRecent Workouts: No workouts recorded yet';
        }

        if (userContext.todayNutrition) {
          contextString += `\n\nToday's Nutrition:\n- Calories: ${userContext.todayNutrition.calories}\n- Protein: ${userContext.todayNutrition.protein}g`;
        } else {
          contextString += '\n\nToday\'s Nutrition: No meals logged yet';
        }

        if (userContext.weeklyStats) {
          contextString += `\n\nThis Week:\n- Total Workouts: ${userContext.weeklyStats.workouts}`;
        }

        contextString += '\n\n=== END USER DATA ===';
      } else {
        console.log('⚠️ No user context provided');
        contextString = '\n\n=== USER DATA ===\nNo workout or nutrition data available yet.\n=== END USER DATA ===';
      }

      const systemPromptWithContext = ATLAS_SYSTEM_PROMPT + contextString;
      console.log('📝 System prompt with context:', systemPromptWithContext);

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPromptWithContext },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);

        if (response.status === 401) {
          return "API key is invalid. Check that you copied the full key (starts with sk-) 🔑";
        }
        if (response.status === 429) {
          return "Rate limit hit. Wait a moment and try again! ⏳";
        }
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const atlasMessage = data.choices[0]?.message?.content ||
        "Sorry, I didn't catch that. Can you try again?";

      console.log('✅ Atlas response:', atlasMessage);
      return atlasMessage;
    } catch (error) {
      console.error('❌ Error getting Atlas response:', error);
      return "Sorry, I'm having trouble connecting to OpenAI right now. Try again! 🤔";
    }
  }

  /**
   * Analyze a completed workout and provide insights
   */
  async analyzeWorkout(workoutData: {
    templateName: string;
    duration: number;
    exercises: Array<{
      name: string;
      sets: Array<{ reps: number; weight: number; completed: boolean }>;
    }>;
  }): Promise<string> {
    try {
      const { templateName, duration, exercises } = workoutData;

      const totalSets = exercises.reduce(
        (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
        0
      );

      const totalVolume = exercises.reduce((sum, ex) => {
        const exVolume = ex.sets
          .filter(s => s.completed)
          .reduce((exSum, set) => exSum + set.reps * set.weight, 0);
        return sum + exVolume;
      }, 0);

      return `💪 Solid ${templateName} session!

✅ ${totalSets} sets completed in ${duration} minutes
📊 ${Math.round(totalVolume).toLocaleString()} lbs total volume

Keep this intensity up and you'll see great progress! 🔥`;
    } catch (error) {
      console.error('❌ Error analyzing workout:', error);
      return "Great workout! Keep crushing it! 💪";
    }
  }
}

export default new OpenAIService();

// Export named functions for backward compatibility
const openaiService = new OpenAIService();
export const getAtlasResponse = openaiService.getAtlasResponse.bind(openaiService);
export const analyzeWorkout = openaiService.analyzeWorkout.bind(openaiService);
