import type {
  AttackLabModulesResponse,
  AttackLabRunRequest,
  AttackLabRunResult,
  AuthorizedTargetRunRequest,
  AuthorizedTargetRunResult,
  CapabilityReplayResult,
  DualModelJailbreakRequest,
  DualModelJailbreakResult,
  JailbreakRedteamRequest,
  JailbreakRedteamResult,
  LearningLabRunRequest,
  LearningLabRunResult,
  LearningLabScenariosResponse,
  TargetLabState
} from '../types';
import { request } from './apiRequest';

export async function fetchAttackLabModules(): Promise<AttackLabModulesResponse> {
  return request<AttackLabModulesResponse>('/api/attack_lab/modules');
}

export async function runAttackLabModule(payload: AttackLabRunRequest): Promise<AttackLabRunResult> {
  return request<AttackLabRunResult>('/api/attack_lab/run', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function runCapabilityReplay(): Promise<CapabilityReplayResult> {
  return request<CapabilityReplayResult>(
    '/api/capability_replay/run',
    {
      method: 'POST',
      body: JSON.stringify({})
    },
    { timeoutMs: 60000 }
  );
}

export async function fetchLearningLabScenarios(): Promise<LearningLabScenariosResponse> {
  return request<LearningLabScenariosResponse>('/api/learning_lab/scenarios');
}

export async function runLearningLabAttack(payload: LearningLabRunRequest): Promise<LearningLabRunResult> {
  return request<LearningLabRunResult>(
    '/api/learning_lab/run',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { timeoutMs: 45000 }
  );
}

export async function runJailbreakRedteam(payload: JailbreakRedteamRequest): Promise<JailbreakRedteamResult> {
  return request<JailbreakRedteamResult>(
    '/api/redteam_lab/jailbreak/run',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { timeoutMs: 45000 }
  );
}

export async function runDualModelJailbreak(payload: DualModelJailbreakRequest): Promise<DualModelJailbreakResult> {
  return request<DualModelJailbreakResult>(
    '/api/redteam_lab/jailbreak/dual_model/run',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { timeoutMs: 60000 }
  );
}

export async function runAuthorizedTarget(payload: AuthorizedTargetRunRequest): Promise<AuthorizedTargetRunResult> {
  return request<AuthorizedTargetRunResult>(
    '/api/redteam_lab/authorized_target/run',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { timeoutMs: 45000 }
  );
}

export async function fetchTargetLabState(): Promise<TargetLabState> {
  return request<TargetLabState>('/api/target_lab/state');
}

export async function resetTargetLabState(): Promise<TargetLabState> {
  return request<TargetLabState>('/api/target_lab/reset', {
    method: 'POST',
    body: JSON.stringify({})
  });
}
