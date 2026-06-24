import { InvestigationRepository, Investigation } from "../repositories/InvestigationRepository"

class InvestigationService {
  private repo = new InvestigationRepository()

  async getAll(): Promise<Investigation[]> {
    return await this.repo.getAll()
  }

  async getById(id: string): Promise<Investigation | null> {
    return await this.repo.getById(id)
  }

  async updateStatus(id: string, status: Investigation['status']): Promise<Investigation> {
    return await this.repo.update(id, { status })
  }
}

export const investigationService = new InvestigationService()
