import { BaseRepository } from "./BaseRepository"

export interface CircuitBreaker {
  id: string
  company_id: string
  model_id: string
  feature: string
  threshold_exceeded: boolean
  action_taken: string
  created_at: string
}

export interface RashomonModel {
  id: string
  company_id: string
  model_version: string
  performance_score: number
  fairness_score: number
  is_active: boolean
  created_at: string
}

export class CircuitBreakerRepository extends BaseRepository<CircuitBreaker> {
  constructor(serverTenantId?: string) {
    super("circuit_breakers", serverTenantId)
  }
}

export class RashomonRepository extends BaseRepository<RashomonModel> {
  constructor(serverTenantId?: string) {
    super("rashomon_models", serverTenantId)
  }
}

export const circuitBreakerRepository = new CircuitBreakerRepository()
export const rashomonRepository = new RashomonRepository()
