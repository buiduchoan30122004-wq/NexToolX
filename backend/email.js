import { getDb } from './db.js';

/**
 * Gửi email cảm ơn và xác nhận đơn hàng thông qua Resend API
 * @param {string} toEmail Email của khách hàng
 * @param {object} toolInfo Thông tin công cụ vừa submit
 * @param {string} plan Gói dịch vụ ('fast' hoặc 'featured')
 */
export async function sendThankYouEmail(toEmail, toolInfo, plan) {
  try {
    const db = await getDb();
    
    // Lấy cấu hình Resend từ database settings
    const settingsRows = await db.all('SELECT key, value FROM settings');
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    const apiKey = settings.resend_api_key;
    const fromEmail = settings.resend_from_email || 'onboarding@resend.dev';
    
    const planName = plan === 'featured' ? 'Featured Listing ($100)' : 'Fast Track ($30)';
    const planBenefits = plan === 'featured' 
      ? 'Sự xuất hiện nổi bật tại đầu trang chủ (Featured section), vị trí ưu tiên trong kết quả tìm kiếm và được gắn nhãn nổi bật để thu hút tối đa lượt click.'
      : 'Bỏ qua hàng chờ duyệt thường, tự động duyệt xuất bản trong 24 giờ và hiển thị tại danh sách công cụ mới ra mắt.';

    // Giao diện Email HTML cao cấp tông màu xanh lá (Emerald) đồng bộ thương hiệu NexToolX
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank You for your Submission to NexToolX</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #1f2937; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #ffffff; border-bottom: 1px solid #f3f4f6; padding: 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #10b981; text-decoration: none; letter-spacing: -0.5px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .welcome { font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; }
          .box { background-color: #f0fdf4; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .box-title { font-weight: 700; color: #065f46; margin-top: 0; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .box-plan { font-size: 22px; font-weight: 800; color: #10b981; margin: 8px 0; }
          .details { margin: 20px 0; border-collapse: collapse; width: 100%; }
          .details td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .details td.label { color: #6b7280; font-weight: 500; width: 35%; }
          .details td.value { color: #111827; font-weight: 600; text-align: right; }
          .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          .footer a { color: #10b981; text-decoration: none; font-weight: 600; }
          .btn { display: inline-block; background-color: #10b981; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="https://nextoolx.com" class="logo">NexToolX</a>
          </div>
          <div class="content">
            <h1 class="welcome">Thank you for submitting your tool!</h1>
            <p>Hi there,</p>
            <p>We've successfully received your payment and submission details for <strong>${toolInfo.name}</strong>. Our system has automatically queued your tool for verification.</p>
            
            <div class="box">
              <div class="box-title">Selected Plan</div>
              <div class="box-plan">${planName}</div>
              <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.5;">${planBenefits}</p>
            </div>

            <p class="welcome" style="font-size: 16px; margin-bottom: 8px;">Submission Details:</p>
            <table class="details">
              <tr>
                <td class="label">Tool Name</td>
                <td class="value">${toolInfo.name}</td>
              </tr>
              <tr>
                <td class="label">Website URL</td>
                <td class="value"><a href="${toolInfo.website_url}" style="color: #10b981; text-decoration: none;">${toolInfo.website_url}</a></td>
              </tr>
              <tr>
                <td class="label">Pricing Model</td>
                <td class="value">${toolInfo.pricing_type}</td>
              </tr>
              <tr>
                <td class="label">Status</td>
                <td class="value" style="color: #f59e0b;">Pending Approval</td>
              </tr>
            </table>

            <p style="margin-top: 24px;"><strong>⏰ What happens next?</strong></p>
            <p>Our administrators are reviewing your submission to ensure the description and category tags are correctly formatted. Since you purchased a premium listing, your tool is placed at the front of our review queue and will be published live shortly (typically within 15 minutes).</p>
            
            <p><strong>✉️ Need urgent help?</strong></p>
            <p>If you have any questions, need to update your submission, or require support, simply <strong>reply directly to this email</strong>. Our support team will receive your message and assist you immediately.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${toolInfo.website_url}" class="btn">View Your Submission</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 NexToolX AI Directory. All rights reserved.</p>
            <p>If you need support, reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Nếu không cấu hình API Key, in ra console
    if (!apiKey) {
      console.log('========================================================================');
      console.log('[MOCK EMAIL SENDER] Resend API Key is not configured. Logged email content:');
      console.log(`To: ${toEmail}`);
      console.log(`From: ${fromEmail}`);
      console.log(`Subject: Thank you for your purchase on NexToolX!`);
      console.log(`Tool: ${toolInfo.name} (Plan: ${planName})`);
      console.log('========================================================================');
      return { success: true, mocked: true };
    }

    // Gọi API của Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        reply_to: fromEmail,
        subject: `Thank you for your purchase: ${toolInfo.name} on NexToolX`,
        html: htmlContent
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[Resend Email] Successfully sent email confirmation to ${toEmail} via Resend. ID:`, data.id);
      return { success: true, emailId: data.id };
    } else {
      console.error('[Resend Email Error] Resend API error response:', data);
      return { success: false, error: data.message || 'Resend error' };
    }

  } catch (error) {
    console.error('[Resend Email Exception] Failed to execute email send:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email tự động theo chuỗi (Email 1, 2, 3) qua Resend API
 * @param {string} toEmail Email người nhận
 * @param {string} name Tên người nhận
 * @param {string} emailType Loại email ('welcome', 'nurture', 'promo')
 */
export async function sendSequenceEmail(toEmail, name, emailType) {
  try {
    const db = await getDb();
    
    // Lấy cấu hình Resend từ database settings
    const settingsRows = await db.all('SELECT key, value FROM settings');
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    const apiKey = settings.resend_api_key;
    const fromEmail = settings.resend_from_email || 'onboarding@resend.dev';
    
    let subject = '';
    let htmlContent = '';

    if (emailType === 'welcome') {
      subject = 'Welcome to NexToolX! Here are 3 trending AI tools to start with 🚀';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #10b981; text-decoration: none; letter-spacing: -0.5px; }
            .content { margin-top: 24px; }
            .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .btn { display: inline-block; background-color: #10b981; color: white !important; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <a href="http://localhost:5174/" class="logo">NexToolX</a>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Thanks for joining NexToolX. We curate the most practical AI tools to help you save time and streamline your daily workflow.</p>
            <p>No spam, just one high-value update every Thursday.</p>
            <p>To get you started, here are the top 3 AI tools trending on NexToolX this week:</p>
            <ul>
              <li><strong>Tool 1 (Copywriting)</strong> – Instantly generate high-converting marketing copy and SEO articles.</li>
              <li><strong>Tool 2 (Video Creator)</strong> – Create professional video ads with automated AI voiceovers in minutes.</li>
              <li><strong>Tool 3 (Automation)</strong> – Automatically summarize long documents, articles, and meeting notes.</li>
            </ul>
            <p style="margin-top: 24px; text-align: center;">
              <a href="http://localhost:5174/" class="btn">Explore Tools</a>
            </p>
            <p>Have a productive day!</p>
            <p>Best regards,<br>The NexToolX Team</p>
          </div>
          <div class="footer">
            <p>P.S. Developed an AI tool? Submit it here to reach our growing tech community: <a href="http://localhost:5174/submit" style="color: #10b981; text-decoration: none;">http://localhost:5174/submit</a></p>
          </div>
        </body>
        </html>
      `;
    } else if (emailType === 'nurture') {
      subject = '💡 Quick tip: Automate your content workflow in 5 minutes';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #10b981; text-decoration: none; letter-spacing: -0.5px; }
            .content { margin-top: 24px; }
            .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .link-btn { color: #10b981; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <a href="http://localhost:5174/" class="logo">NexToolX</a>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Testing new tools is great, but combining them is where the real leverage is. Here is a simple, automated workflow you can set up today to save hours on content creation:</p>
            <ol>
              <li>Draft a script using copywriting tools.</li>
              <li>Import the script into a video generation tool to automatically create videos with natural-sounding voiceovers.</li>
              <li>Use social media automation platforms to schedule and post your content automatically.</li>
            </ol>
            <p>It takes less than 5 minutes to set up and runs 24/7.</p>
            <p>We have curated the best tools to help you build this exact setup on NexToolX:</p>
            <ul>
              <li style="margin-bottom: 8px;"><a href="http://localhost:5174/categories/copywriting" class="link-btn">Explore Copywriting Tools</a></li>
              <li><a href="http://localhost:5174/categories/video-generator" class="link-btn">Explore Video Generators</a></li>
            </ul>
            <p>We hope this helps streamline your workflow!</p>
            <p>Best regards,<br>The NexToolX Team</p>
          </div>
          <div class="footer">
            <p>P.S. Want to showcase your AI tool to our users? List your product here: <a href="http://localhost:5174/submit" style="color: #10b981; text-decoration: none;">http://localhost:5174/submit</a></p>
          </div>
        </body>
        </html>
      `;
    } else if (emailType === 'promo') {
      subject = '🎁 3 premium AI tools offering free trials this month';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #10b981; text-decoration: none; letter-spacing: -0.5px; }
            .content { margin-top: 24px; }
            .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .btn { display: inline-block; background-color: #10b981; color: white !important; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <a href="http://localhost:5174/" class="logo">NexToolX</a>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Testing new software shouldn't be expensive. This week, we have curated 3 high-quality AI tools on NexToolX that you can start using for free right now:</p>
            <ul>
              <li><strong>Designer tool</strong> – AI-powered vector graphic and logo generator for creators and startups.</li>
              <li><strong>Developer helper</strong> – Automated code assistant that debugs and writes code snippets in real-time.</li>
              <li><strong>Customer agent</strong> – AI assistant that drafts professional email and message replies based on your tone.</li>
            </ul>
            <p style="margin-top: 24px; text-align: center;">
              <a href="http://localhost:5174/" class="btn">Claim Free Trials</a>
            </p>
            <p>Let us know which tool helped you save the most time this week.</p>
            <p>Best regards,<br>The NexToolX Team</p>
          </div>
          <div class="footer">
            <p>P.S. Are you building the next big AI tool? Submit your project to NexToolX: <a href="http://localhost:5174/submit" style="color: #10b981; text-decoration: none;">http://localhost:5174/submit</a></p>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error(`Invalid emailType: ${emailType}`);
    }

    if (!apiKey) {
      console.log('========================================================================');
      console.log(`[MOCK SEQUENCE EMAIL] Resend API Key is not configured. Logged content:`);
      console.log(`To: ${toEmail}`);
      console.log(`From: ${fromEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Type: ${emailType}`);
      console.log('========================================================================');
      return { success: true, mocked: true };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: subject,
        html: htmlContent
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[Sequence Email] Sent ${emailType} email to ${toEmail} via Resend. ID:`, data.id);
      return { success: true, emailId: data.id };
    } else {
      console.error(`[Sequence Email Error] Resend error for ${emailType}:`, data);
      return { success: false, error: data.message || 'Resend error' };
    }
  } catch (error) {
    console.error(`[Sequence Email Exception] Failed to send ${emailType}:`, error.message);
    return { success: false, error: error.message };
  }
}
