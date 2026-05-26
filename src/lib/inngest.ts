import { Inngest, EventSchemas } from "inngest"

// Define strongly-typed Inngest events matching compliance thresholds
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

// Initialize the Inngest client using standard EventSchemas constructor (Inngest v3)
export const inngest = new Inngest({ 
  id: "avarent-meridian",
  schemas: new EventSchemas().fromRecord<Events>()
})
