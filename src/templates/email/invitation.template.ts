interface InvitationEmailData {
  organizationName: string;
  inviterName: string;
  inviteeEmail: string;
  role: string;
  invitationUrl: string;
  expirationDays: number;
}

export const generateInvitationEmailTemplate = (
  data: InvitationEmailData
): string => {
  const {
    organizationName,
    inviterName,
    inviteeEmail,
    role,
    invitationUrl,
    expirationDays,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join ${organizationName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #000000;
            color: #ECEDEE;
            line-height: 1.6;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #18181b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #006FEE 0%, #9353d3 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin: 0;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .logo::after {
            content: '✨';
            margin-left: 8px;
            font-size: 24px;
        }
        
        .content {
            padding: 40px 30px;
            background-color: #18181b;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 20px 0;
            color: #ECEDEE;
        }
        
        .invitation-card {
            background-color: #27272a;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            position: relative;
            overflow: hidden;
        }
        
        .invitation-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #006FEE, #9353d3);
        }
        
        .invitation-text {
            margin: 0 0 16px 0;
            font-size: 16px;
            line-height: 1.6;
            color: #ECEDEE;
        }
        
        .organization-name {
            color: #006FEE;
            font-weight: 600;
        }
        
        .inviter-name {
            color: #17c964;
            font-weight: 600;
        }
        
        .role-badge {
            display: inline-block;
            background: linear-gradient(135deg, #9353d3, #006FEE);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            text-transform: capitalize;
            margin: 0 4px;
        }
        
        .cta-container {
            text-align: center;
            margin: 32px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #006FEE 0%, #0066cc 100%);
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 111, 238, 0.3);
        }
        
        .cta-button:hover {
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(0, 111, 238, 0.4);
        }
        
        .details-section {
            background-color: #3f3f46;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .details-title {
            font-size: 14px;
            font-weight: 600;
            color: #ECEDEE;
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            min-height: 40px;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-size: 14px;
            color: #a1a1aa;
            font-weight: 500;
            min-width: 120px;
            text-align: left;
        }
        
        .detail-value {
            font-size: 15px;
            color: #ECEDEE;
            font-weight: 600;
            text-align: right;
            max-width: 200px;
            word-break: break-word;
        }
        
        .detail-value.role {
            background: rgba(0, 111, 238, 0.15);
            color: #006FEE;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
            font-size: 14px;
            color: #ECEDEE;
            font-weight: 500;
        }
        
        .expiration-warning {
            background-color: rgba(245, 165, 36, 0.1);
            border: 1px solid rgba(245, 165, 36, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
        }
        
        .expiration-warning .icon {
            font-size: 20px;
            margin-bottom: 8px;
        }
        
        .expiration-text {
            font-size: 14px;
            color: #f5a524;
            margin: 0;
        }
        
        .footer {
            background-color: #000000;
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .footer-text {
            font-size: 12px;
            color: #71717a;
            margin: 0 0 16px 0;
            line-height: 1.5;
        }
        
        .footer-link {
            color: #006FEE;
            text-decoration: none;
            word-break: break-all;
            font-size: 12px;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        .security-notice {
            background-color: #27272a;
            border-left: 4px solid #f31260;
            padding: 16px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .security-notice .icon {
            color: #f31260;
            margin-right: 8px;
        }
        
        .security-text {
            font-size: 13px;
            color: #a1a1aa;
            margin: 0;
        }
        
        @media (max-width: 600px) {
            .container {
                border-radius: 0;
                margin: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .logo {
                font-size: 28px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .cta-button {
                padding: 14px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="logo">Mirai</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h2 class="greeting">You're Invited! 🎉</h2>
            
            <div class="invitation-card">
                <p class="invitation-text">
                    <span class="inviter-name">${inviterName}</span> has invited you to join 
                    <span class="organization-name">${organizationName}</span> as a 
                    <span class="role-badge">${role.toLowerCase()}</span>
                </p>
                
                <p class="invitation-text">
                    Join your team and start collaborating on projects with Mirai's powerful 
                    project management tools.
                </p>
            </div>
            
            <!-- Call to Action -->
            <div class="cta-container">
                <a href="${invitationUrl}" class="cta-button">
                    Accept Invitation
                </a>
            </div>
            
            <!-- Invitation Details -->
            <div class="details-section">
                <h3 class="details-title">Invitation Details</h3>
                <div class="detail-item">
                    <span class="detail-label">Organization:</span>
                    <span class="detail-value">${organizationName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Invited by:</span>
                    <span class="detail-value">${inviterName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Role:</span>
                    <span class="detail-value role">${role}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${inviteeEmail}</span>
                </div>
            </div>
            
            <!-- Expiration Warning -->
            <div class="expiration-warning">
                <div class="icon">⏰</div>
                <p class="expiration-text">
                    This invitation expires in ${expirationDays} days
                </p>
            </div>
            
            <!-- Security Notice -->
            <div class="security-notice">
                <p class="security-text">
                    <span class="icon">🔒</span>
                    If you didn't expect this invitation, you can safely ignore this email. 
                    Only accept invitations from people you trust.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Having trouble with the button above? Copy and paste this link into your browser:
            </p>
            <a href="${invitationUrl}" class="footer-link">${invitationUrl}</a>
            
            <p class="footer-text" style="margin-top: 24px;">
                This email was sent by Mirai Project Management Platform.
                <br>
                © ${new Date().getFullYear()} Mirai. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

// Generate plain text version for email clients that don't support HTML
export const generateInvitationEmailPlainText = (
  data: InvitationEmailData
): string => {
  const {
    organizationName,
    inviterName,
    inviteeEmail,
    role,
    invitationUrl,
    expirationDays,
  } = data;

  return `
MIRAI - YOU'RE INVITED!

Hi there,

${inviterName} has invited you to join ${organizationName} as a ${role.toLowerCase()}.

INVITATION DETAILS:
- Organization: ${organizationName}
- Invited by: ${inviterName}
- Role: ${role}
- Invited email: ${inviteeEmail}

ACCEPT YOUR INVITATION:
${invitationUrl}

⏰ IMPORTANT: This invitation expires in ${expirationDays} days.

🔒 SECURITY NOTICE: If you didn't expect this invitation, you can safely ignore this email. Only accept invitations from people you trust.

---
This email was sent by Mirai Project Management Platform.
© ${new Date().getFullYear()} Mirai. All rights reserved.

Having trouble? Copy and paste this link into your browser:
${invitationUrl}
  `;
};
