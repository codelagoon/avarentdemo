export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { createAdminClient } from "@/lib/supabase/admin";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function assertTenantAccess(companyId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Unauthorized tenant access for company ${companyId}`);
  }
}

const sealLedgerFn = inngest.createFunction(
  { id: "seal-ledger", name: "SHA-256 Ledger Sealing" },
  { event: "ledger/seal" },
  async ({ event }) => {
    const endpoint = process.env.LEDGER_SEAL_SERVICE_URL;
    if (!endpoint) {
      throw new Error(
        "Ledger sealing is not configured. Set LEDGER_SEAL_SERVICE_URL to a backend that computes hash chains."
      );
    }

    const { applicantId, decisionEvent, companyId, userId } = event.data as {
      applicantId: string;
      decisionEvent: string;
      companyId: string;
      userId: string;
    };

    if (!companyId || !userId) {
      throw new Error("ledger/seal requires companyId and userId for tenant validation");
    }

    await assertTenantAccess(companyId, userId);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId, decisionEvent, companyId }),
    });

    if (!res.ok) {
      throw new Error(`Ledger seal service failed: ${res.status}`);
    }

    return { success: true, result: await res.json() };
  }
);

const trainGANFn = inngest.createFunction(
  { id: "train-gan-modal", name: "Modal Serverless GAN Training" },
  { event: "gan/train" },
  async ({ event, step }) => {
    const { epochs, privacyBudget, quality } = event.data;

    const modalEndpoint = requireEnv("MODAL_ML_COMPUTE_URL");

    const modalResponse = await step.run("invoke-modal-container", async () => {
      const token = process.env.MODAL_API_TOKEN ?? "";
      const payload = { epochs, privacyBudget, quality };
      const res = await fetch(modalEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Modal request failed: ${res.status}`);
      }
      return await res.json();
    });

    return { success: true, modalResponse };
  }
);

const scanAdversarialFn = inngest.createFunction(
  { id: "scan-adversarial-proxy", name: "Adversarial Proxy Scanner" },
  { event: "adversarial/scan" },
  async ({ event }) => {
    const endpoint = process.env.ADVERSARIAL_SCAN_SERVICE_URL;
    if (!endpoint) {
      throw new Error(
        "Adversarial proxy scan is not configured. Set ADVERSARIAL_SCAN_SERVICE_URL."
      );
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event.data),
    });

    if (!res.ok) {
      throw new Error(`Adversarial scan service failed: ${res.status}`);
    }

    return { success: true, auditReport: await res.json() };
  }
);

const searchLDAFn = inngest.createFunction(
  { id: "search-lda-alternative", name: "Less Discriminatory Alternative Search" },
  { event: "lda/search" },
  async ({ event }) => {
    const endpoint = process.env.LDA_SEARCH_SERVICE_URL;
    if (!endpoint) {
      throw new Error(
        "LDA search is not configured. Set LDA_SEARCH_SERVICE_URL to a statistical analysis backend."
      );
    }

    const { companyId, currentAir, userId } = event.data as {
      companyId: string;
      currentAir: number;
      userId: string;
    };

    if (!companyId || !userId) {
      throw new Error("lda/search requires companyId and userId for tenant validation");
    }

    await assertTenantAccess(companyId, userId);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, currentAir }),
    });

    if (!res.ok) {
      throw new Error(`LDA search service failed: ${res.status}`);
    }

    const ldaResult = await res.json();

    const supabase = createAdminClient();
    const { error } = await supabase.from("threat_log").insert({
      company_id: companyId,
      applicant_name: "System",
      applicant_id: "lda-search",
      applicant_ref: "REF-LDA-SYSTEM",
      attack_vector: "LDA Search Completed",
      risk_score: 0,
      severity: "nominal",
      status: "resolved",
      signal_label: "LDA search completed",
      description: "Less discriminatory alternative search completed",
    });

    if (error) {
      throw new Error(`Failed to record LDA search in threat_log: ${error.message}`);
    }

    return { success: true, ldaResult };
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sealLedgerFn, trainGANFn, scanAdversarialFn, searchLDAFn],
});
