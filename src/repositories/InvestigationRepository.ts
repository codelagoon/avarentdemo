import { BaseRepository } from "./BaseRepository"

export interface Investigation {
  id: string
  company_id: string
  title: string
  status: 'open' | 'in_progress' | 'under_review' | 'closed'
  assignee: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export class InvestigationRepository extends BaseRepository<Investigation> {
  constructor() {
    super('investigations')
  }
}
