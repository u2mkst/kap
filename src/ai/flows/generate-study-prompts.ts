'use server';
/**
 * @fileOverview A Genkit flow for generating study prompts based on a given topic.
 *
 * - generateStudyPrompts - A function that handles the generation of study prompts.
 * - GenerateStudyPromptsInput - The input type for the generateStudyPrompts function.
 * - GenerateStudyPromptsOutput - The return type for the generateStudyPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyPromptsInputSchema = z.object({
  topic: z.string().describe('The learning topic or concept for which to generate study prompts or questions.'),
});
export type GenerateStudyPromptsInput = z.infer<typeof GenerateStudyPromptsInputSchema>;

const GenerateStudyPromptsOutputSchema = z.object({
  studyPrompts: z.array(z.string()).describe('A list of 5-7 comprehensive study prompts or questions related to the provided topic, designed to help a student review and deepen their understanding.'),
});
export type GenerateStudyPromptsOutput = z.infer<typeof GenerateStudyPromptsOutputSchema>;

export async function generateStudyPrompts(
  input: GenerateStudyPromptsInput
): Promise<GenerateStudyPromptsOutput> {
  return generateStudyPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPromptsPrompt',
  input: {schema: GenerateStudyPromptsInputSchema},
  output: {schema: GenerateStudyPromptsOutputSchema},
  prompt: `You are an intelligent educational assistant. Your task is to generate study prompts or questions that help a student effectively review and deepen their understanding of a given topic.

Generate 5-7 comprehensive and thought-provoking questions or prompts related to the following topic. Ensure the prompts cover key concepts, encourage critical thinking, and facilitate a thorough review.

Topic: {{{topic}}}`,
});

const generateStudyPromptsFlow = ai.defineFlow(
  {
    name: 'generateStudyPromptsFlow',
    inputSchema: GenerateStudyPromptsInputSchema,
    outputSchema: GenerateStudyPromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate study prompts.');
    }
    return output;
  }
);
