/**
 * NotificationService
 * 
 * Handles transactional email delivery for critical compliance alerts,
 * case assignments, and governance workflow states.
 * 
 * Designed to drop-in replace with Resend (`npm install resend`).
 * For the pilot phase, this acts as a robust logger.
 */

// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

export interface NotificationPayload {
  to: string
  subject: string
  templateId: 'alert' | 'assignment' | 'approval_request' | 'status_update'
  data: Record<string, any>
}

export const notificationService = {
  /**
   * Dispatches a transactional email to a specific user or role alias.
   */
  async sendEmail(payload: NotificationPayload): Promise<boolean> {
    try {
      // Boilerplate for real Resend implementation:
      /*
      await resend.emails.send({
        from: 'Avarent Compliance <compliance@avarent.ai>',
        to: payload.to,
        subject: payload.subject,
        react: EmailTemplate({ type: payload.templateId, data: payload.data })
      })
      */

      console.log(`[NOTIFICATION_MOCK] 📧 Email Dispatched`)
      console.log(`[NOTIFICATION_MOCK] To:      ${payload.to}`)
      console.log(`[NOTIFICATION_MOCK] Subject: ${payload.subject}`)
      console.log(`[NOTIFICATION_MOCK] Payload:`, payload.data)

      return true
    } catch (error) {
      console.error(`[NOTIFICATION_MOCK] Failed to send email to ${payload.to}`, error)
      return false
    }
  },

  /**
   * Specifically triggers a high-severity alert to the registered CCO alias.
   */
  async triggerFairnessAlert(companyId: string, alertDetails: any) {
    // In production, we query the organization_roles for 'compliance_officer' emails
    return this.sendEmail({
      to: 'compliance@firstnationalbank.com', // fallback mock
      subject: `🚨 CRITICAL: Fairness Threshold Breach Detected`,
      templateId: 'alert',
      data: alertDetails
    })
  },

  /**
   * Notifies an Analyst that a case has been assigned to them.
   */
  async notifyAssignment(analystEmail: string, caseId: string) {
    return this.sendEmail({
      to: analystEmail,
      subject: `Avarent Assignment: Investigation ${caseId.split('-')[0]}`,
      templateId: 'assignment',
      data: { caseId }
    })
  },

  /**
   * Notifies the CCO that an Analyst has requested mitigation sign-off.
   */
  async requestApproval(caseId: string, analystName: string) {
    return this.sendEmail({
      to: 'compliance@firstnationalbank.com',
      subject: `Pending Sign-Off: Mitigation Request from ${analystName}`,
      templateId: 'approval_request',
      data: { caseId, analystName }
    })
  }
}
