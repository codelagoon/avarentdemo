import { Inngest } from "inngest"

// Define strong types for our async events matching compliance thresholds
export type Events = {
  "ledger/seal": {
    data: {
      companyId: string
      applicantId: string
      decisionEvent: string
    }
  }
  "gan/train": {
    data: {
      companyId: string
      epochs: number
      privacyBudget: number
      quality: number
    }
  }
  "adversarial/scan": {
    data: {
      companyId: string
      featureName: string
      correlation: number
      informationValue: number
    }
  }
  "lda/search": {
    data: {
      companyId: string
      modelId: string
      currentAir: number
      currentSpd: number
    }
  }
}

// Initialize the Inngest client
export const inngest = new Inngest({ 
  id: "avarent-meridian",
  schemas: new Inngest.Schema<Events>()
})
