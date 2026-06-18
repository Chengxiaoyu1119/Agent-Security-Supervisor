import type { Scenario } from '../types';
import { fallbackScenarioGroup1 } from './scenarios/group1';
import { fallbackScenarioGroup2 } from './scenarios/group2';
import { fallbackScenarioGroup3 } from './scenarios/group3';
import { fallbackScenarioGroup4 } from './scenarios/group4';

export const fallbackScenarios: Scenario[] = [
  ...fallbackScenarioGroup1,
  ...fallbackScenarioGroup2,
  ...fallbackScenarioGroup3,
  ...fallbackScenarioGroup4
];
