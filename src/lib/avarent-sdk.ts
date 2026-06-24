/**
 * AVARENT Sentinel TypeScript SDK
 * Version: 1.0.0
 * 
 * Provides methods for integrating algorithmic models with the AVARENT platform
 * to automatically track fairness, perform ADT interpretability, and log to the blockchain ledger.
 */

export interface DecisionEventInput {
  applicant_id: string;
  applicant_name: string;
  credit_score?: number;
  income?: number;
  loan_amount?: number;
  debt_to_income?: number;
  outcome: 'approved' | 'denied' | 'referred';
  primary_score?: number;
  fairness_score?: number;
  tower?: 'primary' | 'fairness' | 'circuit_breaker';
  shap_features?: { feature: string; value: number; contribution: number; description: string }[];
  top_reasons?: string[];
  circuit_breaker_triggered?: boolean;
  latency_ms?: number;
  model_version?: string;
}

export interface WebhookConfig {
  url: string;
  events: ('decision.created' | 'drift.alert' | 'circuit.breaker.tripped')[];
  secret?: string;
}

export class AvarentClient {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string = 'http://localhost:5173/api/v1') {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  /**
   * Ingest a single automated decision event into the ADT system.
   */
  async ingestDecision(decision: DecisionEventInput): Promise<{ event_id: string; status: string }> {
    const response = await fetch(`${this.endpoint}/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(decision),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Avarent API Error: ${errorData.error}`);
    }

    return response.json();
  }

  /**
   * Batch import historical decisions from a CSV file (Phase 5b)
   * 
   * The CSV should contain headers matching the DecisionEventInput properties.
   */
  async importDecisionsFromCSV(csvContent: string): Promise<{ imported: number; errors: number }> {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) throw new Error("CSV must contain at least a header and one data row.");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let imported = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record: any = {};
      
      headers.forEach((header, index) => {
        const val = values[index];
        if (!val) return;

        // Parse numerical fields
        if (['credit_score', 'income', 'loan_amount', 'debt_to_income', 'primary_score', 'fairness_score', 'latency_ms'].includes(header)) {
          record[header] = parseFloat(val);
        } else if (header === 'circuit_breaker_triggered') {
          record[header] = val.toLowerCase() === 'true';
        } else {
          record[header] = val;
        }
      });

      // Basic defaults for simulated import
      if (!record.shap_features) record.shap_features = [];
      if (!record.top_reasons) record.top_reasons = [];
      if (!record.tower) record.tower = 'primary';

      try {
        await this.ingestDecision(record as DecisionEventInput);
        imported++;
      } catch (err) {
        console.warn(`Row ${i} failed:`, err);
        errors++;
      }
    }

    return { imported, errors };
  }

  /**
   * Register a webhook to receive real-time ADT and fairness events (Phase 5b)
   */
  async registerWebhook(config: WebhookConfig): Promise<{ id: string; status: string }> {
    // In a real implementation, this would POST to a /api/v1/webhooks endpoint
    // For this prototype, we mock the success response.
    return {
      id: `whk_${Math.random().toString(36).substring(7)}`,
      status: 'active'
    };
  }
}
