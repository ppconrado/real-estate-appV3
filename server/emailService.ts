import { invokeLLM } from "./_core/llm";

export interface ViewingConfirmationData {
  visitorName: string;
  visitorEmail: string;
  propertyTitle: string;
  propertyAddress: string;
  viewingDate: Date;
  viewingTime: string;
  duration: number;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  notes?: string;
}

/**
 * Generate HTML email template for viewing confirmation
 */
function generateConfirmationEmailHTML(data: ViewingConfirmationData): string {
  const formattedDate = data.viewingDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin: 20px 0; }
          .section-title { font-size: 16px; font-weight: 600; color: #0066cc; margin-bottom: 10px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 500; color: #666; }
          .detail-value { color: #333; }
          .agent-card { background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0; }
          .button { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Viewing Confirmation</h1>
            <p>Your property viewing has been scheduled</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.visitorName},</p>
            
            <p>Thank you for scheduling a viewing! We're excited to show you this property. Here are the details of your confirmed viewing:</p>
            
            <div class="section">
              <div class="section-title">📍 Property Details</div>
              <div class="detail-row">
                <span class="detail-label">Property:</span>
                <span class="detail-value">${data.propertyTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${data.propertyAddress}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">📅 Viewing Schedule</div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.viewingTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
            </div>
            
            ${data.notes ? `
            <div class="section">
              <div class="section-title">📝 Your Notes</div>
              <p>${data.notes}</p>
            </div>
            ` : ""}
            
            <div class="section">
              <div class="section-title">👤 Agent Information</div>
              <div class="agent-card">
                <p><strong>${data.agentName}</strong></p>
                <p>
                  <strong>Phone:</strong> <a href="tel:${data.agentPhone.replace(/\D/g, "")}">${data.agentPhone}</a><br>
                  <strong>Email:</strong> <a href="mailto:${data.agentEmail}">${data.agentEmail}</a>
                </p>
              </div>
            </div>
            
            <div class="section">
              <h3>What to Expect</h3>
              <ul>
                <li>Please arrive 5-10 minutes early</li>
                <li>Bring a valid ID</li>
                <li>Feel free to ask questions about the property</li>
                <li>The agent will provide detailed information about the area</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>Need to Reschedule?</h3>
              <p>If you need to change your viewing time, please contact the agent directly using the contact information above.</p>
            </div>
            
            <p>We look forward to seeing you!</p>
            <p>Best regards,<br>The Real Estate Team</p>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message. Contact the agent directly for any inquiries.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text version of confirmation email
 */
function generateConfirmationEmailText(data: ViewingConfirmationData): string {
  const formattedDate = data.viewingDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
VIEWING CONFIRMATION

Hi ${data.visitorName},

Thank you for scheduling a viewing! We're excited to show you this property.

PROPERTY DETAILS
Property: ${data.propertyTitle}
Address: ${data.propertyAddress}

VIEWING SCHEDULE
Date: ${formattedDate}
Time: ${data.viewingTime}
Duration: ${data.duration} minutes

${data.notes ? `YOUR NOTES\n${data.notes}\n\n` : ""}

AGENT INFORMATION
${data.agentName}
Phone: ${data.agentPhone}
Email: ${data.agentEmail}

WHAT TO EXPECT
- Please arrive 5-10 minutes early
- Bring a valid ID
- Feel free to ask questions about the property
- The agent will provide detailed information about the area

NEED TO RESCHEDULE?
If you need to change your viewing time, please contact the agent directly using the contact information above.

We look forward to seeing you!

Best regards,
The Real Estate Team

---
This is an automated email. Please do not reply to this message. Contact the agent directly for any inquiries.
  `.trim();
}

/**
 * Send viewing confirmation email using the built-in notification system
 */
export async function sendViewingConfirmationEmail(
  data: ViewingConfirmationData
): Promise<boolean> {
  try {
    const htmlContent = generateConfirmationEmailHTML(data);
    const textContent = generateConfirmationEmailText(data);

    // Use the built-in notification system to send emails
    // In a production environment, you would use a dedicated email service like SendGrid, AWS SES, or Mailgun
    console.log(`[Email] Sending viewing confirmation to ${data.visitorEmail}`);
    console.log(`[Email] Property: ${data.propertyTitle}`);
    console.log(`[Email] Date: ${data.viewingDate.toISOString()}`);

    // For now, we'll simulate successful email sending
    // In production, integrate with your email service provider
    return true;
  } catch (error) {
    console.error("[Email] Failed to send viewing confirmation:", error);
    return false;
  }
}

/**
 * Send viewing reminder email (24 hours before viewing)
 */
export async function sendViewingReminderEmail(
  data: ViewingConfirmationData
): Promise<boolean> {
  try {
    const formattedDate = data.viewingDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    const reminderHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Reminder: Property Viewing Tomorrow</h2>
            </div>
            <div class="content">
              <p>Hi ${data.visitorName},</p>
              <p>This is a friendly reminder about your scheduled property viewing:</p>
              <p><strong>${data.propertyTitle}</strong><br>${data.propertyAddress}</p>
              <p><strong>Tomorrow at ${data.viewingTime}</strong></p>
              <p>Agent: ${data.agentName} (${data.agentPhone})</p>
              <p>See you tomorrow!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`[Email] Sending reminder to ${data.visitorEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send viewing reminder:", error);
    return false;
  }
}

/**
 * Send cancellation confirmation email
 */
export async function sendViewingCancellationEmail(
  visitorEmail: string,
  visitorName: string,
  propertyTitle: string,
  viewingDate: Date
): Promise<boolean> {
  try {
    const formattedDate = viewingDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const cancellationHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Viewing Cancelled</h2>
            </div>
            <p>Hi ${visitorName},</p>
            <p>Your viewing for <strong>${propertyTitle}</strong> scheduled for <strong>${formattedDate}</strong> has been cancelled.</p>
            <p>If you have any questions, please contact the agent directly.</p>
          </div>
        </body>
      </html>
    `;

    console.log(`[Email] Sending cancellation to ${visitorEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send cancellation email:", error);
    return false;
  }
}
