interface TaskAssignmentEmailData {
  taskTitle: string;
  taskDescription?: string;
  assignerName: string;
  assigneeName: string;
  organizationName: string;
  boardTitle: string;
  columnName: string;
  dueDate?: string;
  priority?: string;
  taskUrl: string;
}

export const generateTaskAssignmentEmailTemplate = (
  data: TaskAssignmentEmailData
): string => {
  const {
    taskTitle,
    taskDescription,
    assignerName,
    assigneeName,
    organizationName,
    boardTitle,
    columnName,
    dueDate,
    priority,
    taskUrl,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Assignment - ${taskTitle}</title>
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
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        .header {
            background: linear-gradient(135deg, #006FEE 0%, #0066cc 100%);
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
            content: '📋';
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
        
        .task-card {
            background-color: #27272a;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            position: relative;
        }
        
        .task-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, #006FEE 0%, #0066cc 100%);
            border-radius: 2px 0 0 2px;
        }
        
        .task-title {
            font-size: 20px;
            font-weight: 700;
            color: #ECEDEE;
            margin: 0 0 12px 0;
        }
        
        .task-description {
            color: #a1a1aa;
            margin: 0 0 20px 0;
            font-size: 15px;
            line-height: 1.5;
        }
        
        .cta-section {
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
            margin: 0 0 16px 0;
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
        
        .detail-value.priority {
            background: rgba(245, 165, 36, 0.15);
            color: #f5a524;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .detail-value.due-date {
            background: rgba(244, 63, 94, 0.15);
            color: #f43f5e;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .footer {
            background-color: #000000;
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer-text {
            color: #71717a;
            font-size: 13px;
            margin: 8px 0;
        }
        
        .footer-link {
            color: #006FEE;
            text-decoration: none;
            word-break: break-all;
            font-size: 12px;
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
        
        <!-- Main Content -->
        <div class="content">
            <h2 class="greeting">You've been assigned a new task!</h2>
            
            <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0;">
                Hi ${assigneeName},
            </p>
            
            <p style="color: #ECEDEE; font-size: 16px; margin: 0 0 24px 0;">
                <strong>${assignerName}</strong> has assigned you a new task in <strong>${organizationName}</strong>.
            </p>
            
            <!-- Task Details Card -->
            <div class="task-card">
                <h3 class="task-title">${taskTitle}</h3>
                ${
                  taskDescription
                    ? `<p class="task-description">${taskDescription}</p>`
                    : ""
                }
            </div>
            
            <!-- Call to Action -->
            <div class="cta-section">
                <a href="${taskUrl}" class="cta-button">
                    View Task Details
                </a>
            </div>
            
            <!-- Task Information -->
            <div class="details-section">
                <h3 class="details-title">Task Information</h3>
                <div class="detail-item">
                    <span class="detail-label">Board:</span>
                    <span class="detail-value">${boardTitle}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Column:</span>
                    <span class="detail-value">${columnName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Assigned by:</span>
                    <span class="detail-value">${assignerName}</span>
                </div>
                ${
                  priority
                    ? `
                <div class="detail-item">
                    <span class="detail-label">Priority:</span>
                    <span class="detail-value priority">${priority}</span>
                </div>
                `
                    : ""
                }
                ${
                  dueDate
                    ? `
                <div class="detail-item">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value due-date">${new Date(
                      dueDate
                    ).toLocaleDateString()}</span>
                </div>
                `
                    : ""
                }
                <div class="detail-item">
                    <span class="detail-label">Organization:</span>
                    <span class="detail-value">${organizationName}</span>
                </div>
            </div>
            
            <!-- Tips Section -->
            <div style="background-color: #27272a; border-left: 4px solid #17c964; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #17c964; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                    💡 Pro Tip:
                </p>
                <p style="color: #a1a1aa; font-size: 13px; margin: 0;">
                    Click "View Task Details" to see the full context, add comments, update status, and collaborate with your team members.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Having trouble with the button above? Copy and paste this link into your browser:
            </p>
            <a href="${taskUrl}" class="footer-link">${taskUrl}</a>
            
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
export const generateTaskAssignmentEmailPlainText = (
  data: TaskAssignmentEmailData
): string => {
  const {
    taskTitle,
    taskDescription,
    assignerName,
    assigneeName,
    organizationName,
    boardTitle,
    columnName,
    dueDate,
    priority,
    taskUrl,
  } = data;

  return `
MIRAI - NEW TASK ASSIGNMENT

Hi ${assigneeName},

You've been assigned a new task!

${assignerName} has assigned you a new task in ${organizationName}.

TASK DETAILS:
Title: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ""}

TASK INFORMATION:
- Board: ${boardTitle}
- Column: ${columnName}
- Assigned by: ${assignerName}
${priority ? `- Priority: ${priority}` : ""}
${dueDate ? `- Due Date: ${new Date(dueDate).toLocaleDateString()}` : ""}
- Organization: ${organizationName}

VIEW TASK: ${taskUrl}

---
This email was sent by Mirai Project Management Platform.
© ${new Date().getFullYear()} Mirai. All rights reserved.
  `;
};
