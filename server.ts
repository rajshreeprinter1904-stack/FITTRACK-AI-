import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please verify Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'AI service authentication error. Please verify your Gemini API key in Settings > Secrets.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'AI rate limit reached. Please wait a moment or upgrade your quota in Settings > Secrets.',
    };
  }
  return {
    status: 500,
    message: raw || 'Unable to generate AI response right now.',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // 1. Personalized AI Workout Plan Generator
  app.post('/api/ai/workout-plan', async (req, res) => {
    try {
      const ai = getGenAIClient();
      const { profile, recentWorkoutsCount = 0, focusNote = '' } = req.body ?? {};

      const prompt = `Create a personalized weekly workout split and today's featured session for this athlete:
- Name: ${profile?.name || 'Athlete'}
- Age: ${profile?.age || 28}, Height: ${profile?.heightCm || 175} cm, Weight: ${profile?.currentWeightKg || 75} kg -> Target: ${profile?.targetWeightKg || 72} kg
- Fitness Level: ${profile?.fitnessLevel || 'intermediate'}
- Primary Goal: ${profile?.fitnessGoal || 'recomp'}
- Preferred Environment: ${profile?.workoutPreference || 'gym'}
- Available Equipment: ${Array.isArray(profile?.equipment) && profile.equipment.length > 0 ? profile.equipment.join(', ') : 'bodyweight only'}
- Workouts Completed Last 7 Days: ${recentWorkoutsCount}
- Specific User Request / Progress Adjustment: ${focusNote || 'Optimize progressive overload and recovery.'}

Provide practical, biomechanically sound exercises matching ONLY their available equipment and fitness level.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an elite CSCS-certified strength, conditioning, and transformation coach for FITTRACK AI. Keep coaching cues concise, safe, evidence-based, and tailored to the user profile.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              planTitle: { type: Type.STRING, description: 'Concise title of the personalized plan.' },
              weeklyScheduleSummary: { type: Type.STRING, description: '1-2 sentence overview of weekly training split.' },
              progressionNote: { type: Type.STRING, description: 'How this plan adapts to their current progress.' },
              sessions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayLabel: { type: Type.STRING },
                    sessionTitle: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      description: 'One of: gym, home, cardio, running_walking, cycling, yoga',
                    },
                    durationMin: { type: Type.NUMBER },
                    estimatedCalories: { type: Type.NUMBER },
                    exercises: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          sets: { type: Type.NUMBER },
                          reps: { type: Type.STRING },
                          restSec: { type: Type.NUMBER },
                          coachingCue: { type: Type.STRING },
                        },
                        required: ['name', 'sets', 'reps', 'restSec', 'coachingCue'],
                      },
                    },
                  },
                  required: ['dayLabel', 'sessionTitle', 'category', 'durationMin', 'estimatedCalories', 'exercises'],
                },
              },
            },
            required: ['planTitle', 'weeklyScheduleSummary', 'progressionNote', 'sessions'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Personalized AI Meal Plan & Diet Recommendations
  app.post('/api/ai/meal-plan', async (req, res) => {
    try {
      const ai = getGenAIClient();
      const { profile, consumedToday = {}, customPreference = '' } = req.body ?? {};

      const prompt = `Design a full-day personalized nutrition meal plan (Breakfast, Lunch, Dinner, and Snack) for this user:
- Goal: ${profile?.fitnessGoal || 'recomp'}
- Dietary Preference: ${profile?.dietaryPreference || 'balanced'}
- Daily Targets: ${profile?.dailyCalorieGoal || 2200} kcal | Protein: ${profile?.dailyProteinGoalG || 160}g | Carbs: ${profile?.dailyCarbsGoalG || 220}g | Fat: ${profile?.dailyFatGoalG || 70}g
- Already Consumed Today: ${consumedToday?.calories || 0} kcal (${consumedToday?.proteinG || 0}g protein)
- Additional Note: ${customPreference || 'Prioritize whole foods, satiety, and easy meal prep.'}

Ensure the 4 meals sum closely to the user's daily calorie and macronutrient targets and strictly respect their dietary preference.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a sports nutritionist for FITTRACK AI. Return accurate calorie and macronutrient breakdowns using practical, accessible ingredients.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategySummary: { type: Type.STRING },
              hydrationTip: { type: Type.STRING },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mealType: {
                      type: Type.STRING,
                      description: 'Must be one of: breakfast, lunch, dinner, snack',
                    },
                    foodName: { type: Type.STRING },
                    servingSize: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    proteinG: { type: Type.NUMBER },
                    carbsG: { type: Type.NUMBER },
                    fatG: { type: Type.NUMBER },
                    prepNote: { type: Type.STRING },
                  },
                  required: ['mealType', 'foodName', 'servingSize', 'calories', 'proteinG', 'carbsG', 'fatG', 'prepNote'],
                },
              },
            },
            required: ['strategySummary', 'hydrationTip', 'meals'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Daily AI Coach Insights (Motivation, Workout Adjustment, Nutrition & Sleep Improvement)
  app.post('/api/ai/daily-insights', async (req, res) => {
    try {
      const ai = getGenAIClient();
      const { profile, todayLog, nutritionTotals, recentWorkoutsCount = 0 } = req.body ?? {};

      const prompt = `Analyze today's tracked fitness metrics and provide actionable daily coaching:
- Athlete: ${profile?.name || 'Athlete'}, Goal: ${profile?.fitnessGoal || 'recomp'}, Weight: ${profile?.currentWeightKg || 75} kg (Target: ${profile?.targetWeightKg || 72} kg)
- Today's Fitness Score: ${todayLog?.fitnessScore ?? 0}/100
- Steps Today: ${todayLog?.steps ?? 0} / ${profile?.dailyStepsGoal ?? 10000}
- Active Minutes: ${todayLog?.activeMinutes ?? 0} / ${profile?.dailyActiveMinutesGoal ?? 45} min
- Water Intake: ${todayLog?.waterMl ?? 0} / ${profile?.dailyWaterGoalMl ?? 2500} ml
- Sleep Last Night: ${todayLog?.sleepHours ?? 0} hrs (Quality: ${todayLog?.sleepQuality ?? 'good'}, Schedule: ${todayLog?.bedTime ?? '23:00'} to ${todayLog?.wakeTime ?? '07:00'})
- Nutrition Today: ${nutritionTotals?.calories ?? 0} / ${profile?.dailyCalorieGoal ?? 2200} kcal, Protein: ${nutritionTotals?.proteinG ?? 0} / ${profile?.dailyProteinGoalG ?? 150}g
- Workouts Last 7 Days: ${recentWorkoutsCount}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the FITTRACK AI personal coach. Give specific, encouraging, data-grounded micro-recommendations without generic clichés. Never claim manual numbers came from live sensors.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              motivationalMessage: { type: Type.STRING },
              dailyImprovementTip: { type: Type.STRING },
              workoutAdjustment: { type: Type.STRING },
              nutritionFeedback: { type: Type.STRING },
              sleepRecommendation: { type: Type.STRING },
            },
            required: [
              'motivationalMessage',
              'dailyImprovementTip',
              'workoutAdjustment',
              'nutritionFeedback',
              'sleepRecommendation',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 4. Interactive AI Coach Q&A
  app.post('/api/ai/coach-chat', async (req, res) => {
    try {
      const ai = getGenAIClient();
      const { message, profile, summaryContext = '' } = req.body ?? {};
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Athlete Profile: ${profile?.name || 'Athlete'}, Goal: ${profile?.fitnessGoal || 'fitness'}, Level: ${profile?.fitnessLevel || 'intermediate'}, Diet: ${profile?.dietaryPreference || 'balanced'}.
Recent Context: ${summaryContext}

Athlete Question: ${message}`,
        config: {
          systemInstruction:
            'You are the FITTRACK AI Personal Fitness & Nutrition Coach. Respond in clear, structured, practical prose (under 160 words). Provide concrete numbers (sets, reps, grams, or minutes) where helpful.',
        },
      });

      res.json({ reply: (response.text ?? '').trim() });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FITTRACK AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
