import { z } from 'zod';
import type { QuestionScoringRule } from '@/domain/scoring/types';

const responseValue = z.number().finite();

export const checkInRequestSchema = z
  .object({
    campaignId: z.string().uuid(),
    responses: z.record(z.string().min(1), responseValue).refine(
      (responses) => Object.keys(responses).length > 0,
      'At least one response is required.'
    ),
  })
  .strict();

export const scoringRulesSchema = z
  .array(
    z
      .object({
        questionId: z.string().min(1),
        domainId: z.string().min(1),
        weight: z.number().finite().positive().optional(),
        reverseScore: z.boolean().optional(),
        minScaleVal: z.number().finite().optional(),
        maxScaleVal: z.number().finite().optional(),
      })
      .strict()
  )
  .min(1)
  .superRefine((rules, context) => {
    const seenQuestions = new Set<string>();

    rules.forEach((rule, index) => {
      const min = rule.minScaleVal ?? 1;
      const max = rule.maxScaleVal ?? 5;

      if (min >= max) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: 'A scoring rule must have a minimum scale below its maximum scale.',
        });
      }

      if (seenQuestions.has(rule.questionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'questionId'],
          message: 'Each scoring rule must use a unique question ID.',
        });
      }

      seenQuestions.add(rule.questionId);
    });
  });

export function validateResponsesAgainstRules(
  responses: Record<string, number>,
  rules: QuestionScoringRule[]
): void {
  const expectedQuestionIds = new Set(rules.map((rule) => rule.questionId));
  const receivedQuestionIds = Object.keys(responses);

  if (
    receivedQuestionIds.length !== expectedQuestionIds.size ||
    receivedQuestionIds.some((questionId) => !expectedQuestionIds.has(questionId))
  ) {
    throw new Error('Responses must include exactly the questions in this assessment version.');
  }

  for (const rule of rules) {
    const answer = responses[rule.questionId];
    const min = rule.minScaleVal ?? 1;
    const max = rule.maxScaleVal ?? 5;

    if (!Number.isInteger(answer) || answer < min || answer > max) {
      throw new Error(`Response for question '${rule.questionId}' is outside its permitted scale.`);
    }
  }
}
