import { describe, expect, it } from 'vitest';
import {
  checkInRequestSchema,
  scoringRulesSchema,
  validateResponsesAgainstRules,
} from '@/app/api/check-in/check-in-guards';

const rules = [
  { questionId: 'q-energy', domainId: 'energy', minScaleVal: 1, maxScaleVal: 5 },
  { questionId: 'q-stress', domainId: 'stress', minScaleVal: 1, maxScaleVal: 5, reverseScore: true },
];

describe('check-in request guardrails', () => {
  it('does not accept a client-controlled tenant or participant identity', () => {
    const result = checkInRequestSchema.safeParse({
      campaignId: '11111111-1111-4111-8111-111111111111',
      responses: { 'q-energy': 4, 'q-stress': 2 },
      tenantId: 'attacker-controlled-tenant',
      participantId: 'attacker-controlled-participant',
    });

    expect(result.success).toBe(false);
  });

  it('requires a non-empty numeric response set', () => {
    expect(
      checkInRequestSchema.safeParse({
        campaignId: '11111111-1111-4111-8111-111111111111',
        responses: {},
      }).success
    ).toBe(false);

    expect(
      checkInRequestSchema.safeParse({
        campaignId: '11111111-1111-4111-8111-111111111111',
        responses: { 'q-energy': '4' },
      }).success
    ).toBe(false);
  });

  it('rejects malformed and duplicate stored scoring rules', () => {
    expect(
      scoringRulesSchema.safeParse([
        { questionId: 'q-one', domainId: 'wellbeing', minScaleVal: 5, maxScaleVal: 1 },
      ]).success
    ).toBe(false);

    expect(
      scoringRulesSchema.safeParse([
        { questionId: 'q-one', domainId: 'wellbeing' },
        { questionId: 'q-one', domainId: 'energy' },
      ]).success
    ).toBe(false);
  });

  it('requires exactly the configured questions on their stored scale', () => {
    expect(() =>
      validateResponsesAgainstRules({ 'q-energy': 4, 'q-stress': 2 }, rules)
    ).not.toThrow();

    expect(() => validateResponsesAgainstRules({ 'q-energy': 4 }, rules)).toThrow(
      /exactly the questions/i
    );
    expect(() =>
      validateResponsesAgainstRules({ 'q-energy': 4, 'q-stress': 2, injected: 1 }, rules)
    ).toThrow(/exactly the questions/i);
    expect(() =>
      validateResponsesAgainstRules({ 'q-energy': 6, 'q-stress': 2 }, rules)
    ).toThrow(/permitted scale/i);
    expect(() =>
      validateResponsesAgainstRules({ 'q-energy': 4.5, 'q-stress': 2 }, rules)
    ).toThrow(/permitted scale/i);
  });
});
