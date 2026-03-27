'use server';
/**
 * @fileOverview An AI assistant that summarizes learning material.
 *
 * - summarizeLearningMaterial - A function that handles the summarization process.
 * - SummarizeLearningMaterialInput - The input type for the summarizeLearningMaterial function.
 * - SummarizeLearningMaterialOutput - The return type for the summarizeLearningMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLearningMaterialInputSchema = z.object({
  learningMaterial: z.string().describe('The learning material (text) to be summarized.'),
});
export type SummarizeLearningMaterialInput = z.infer<typeof SummarizeLearningMaterialInputSchema>;

const SummarizeLearningMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided learning material.'),
});
export type SummarizeLearningMaterialOutput = z.infer<typeof SummarizeLearningMaterialOutputSchema>;

export async function summarizeLearningMaterial(
  input: SummarizeLearningMaterialInput
): Promise<SummarizeLearningMaterialOutput> {
  return summarizeLearningMaterialFlow(input);
}

const summarizeLearningMaterialPrompt = ai.definePrompt({
  name: 'summarizeLearningMaterialPrompt',
  input: {schema: SummarizeLearningMaterialInputSchema},
  output: {schema: SummarizeLearningMaterialOutputSchema},
  prompt: `You are a helpful study assistant. Your goal is to provide a concise summary of the given learning material, focusing on the main ideas and key points.

Learning Material:
{{{learningMaterial}}}`,
});

const summarizeLearningMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeLearningMaterialFlow',
    inputSchema: SummarizeLearningMaterialInputSchema,
    outputSchema: SummarizeLearningMaterialOutputSchema,
  },
  async input => {
    const {output} = await summarizeLearningMaterialPrompt(input);
    return output!;
  }
);
