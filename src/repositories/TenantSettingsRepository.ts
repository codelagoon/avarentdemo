import { BaseRepository } from "./BaseRepository"

export interface TenantSettings {
  id: string
  company_id: string
  alt_data_state: any
  created_at: string
}

export class TenantSettingsRepository extends BaseRepository<TenantSettings> {
  constructor(serverTenantId?: string) {
    super("tenant_settings", serverTenantId)
  }
}

export const tenantSettingsRepository = new TenantSettingsRepository()
