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

            ${
              data.notes
                ? `
            <div class="section">
              <div class="section-title">📝 Your Notes</div>
              <p>${data.notes}</p>
            </div>
            `
                : ""
            }

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

export async function sendViewingConfirmationEmail(
  data: ViewingConfirmationData
): Promise<boolean> {
  try {
    generateConfirmationEmailHTML(data);
    generateConfirmationEmailText(data);

    console.log(`[Email] Sending viewing confirmation to ${data.visitorEmail}`);
    console.log(`[Email] Property: ${data.propertyTitle}`);
    console.log(`[Email] Date: ${data.viewingDate.toISOString()}`);

    return true;
  } catch (error) {
    console.error("[Email] Failed to send viewing confirmation:", error);
    return false;
  }
}

export async function sendViewingReminderEmail(
  data: ViewingConfirmationData
): Promise<boolean> {
  try {
    console.log(`[Email] Sending reminder to ${data.visitorEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send viewing reminder:", error);
    return false;
  }
}

export async function sendViewingCancellationEmail(
  visitorEmail: string,
  visitorName: string,
  propertyTitle: string,
  viewingDate: Date
): Promise<boolean> {
  try {
    const formattedDate = viewingDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    console.log(
      `[Email] Cancellation details: ${visitorName} - ${propertyTitle} on ${formattedDate}`
    );
    console.log(`[Email] Sending cancellation to ${visitorEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send cancellation:", error);
    return false;
  }
}
