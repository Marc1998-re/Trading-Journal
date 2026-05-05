/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const email = e.record.get("email");
  const name = e.record.get("name") || "User";
  
  // Generate verification link - PocketBase will handle the token
  const verificationLink = $app.settings().meta.appUrl + "/auth/verify?token=" + e.record.get("tokenKey");
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Marc's Trading Journal</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
      color: #333;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Header with dark/teal branding */
    .header {
      background: linear-gradient(135deg, #1a3a3a 0%, #2d5f5f 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    
    .logo-text {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      color: #ffffff;
    }
    
    .logo-subtitle {
      font-size: 14px;
      color: #a8d8d8;
      font-weight: 300;
      letter-spacing: 1px;
    }
    
    /* Main content */
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1a3a3a;
      margin-bottom: 16px;
    }
    
    .message {
      font-size: 16px;
      color: #555;
      margin-bottom: 32px;
      line-height: 1.8;
    }
    
    /* Social media icons section */
    .social-section {
      margin: 40px 0;
      padding: 30px 0;
      border-top: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .social-title {
      font-size: 14px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .social-icons {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .social-icon {
      display: inline-block;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #2d5f5f;
      text-align: center;
      line-height: 50px;
      text-decoration: none;
      transition: all 0.3s ease;
      font-size: 24px;
    }
    
    .social-icon:hover {
      background-color: #1a3a3a;
      transform: scale(1.1);
    }
    
    .social-icon.facebook {
      color: #1877f2;
    }
    
    .social-icon.instagram {
      color: #e4405f;
    }
    
    .social-icon.linkedin {
      color: #0a66c2;
    }
    
    .social-icon.twitter {
      color: #1da1f2;
    }
    
    /* Verify button */
    .button-container {
      margin: 40px 0;
    }
    
    .verify-button {
      display: inline-block;
      background: linear-gradient(135deg, #2d5f5f 0%, #1a3a3a 100%);
      color: #ffffff;
      padding: 16px 48px;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      border: 2px solid #2d5f5f;
      cursor: pointer;
      text-transform: uppercase;
    }
    
    .verify-button:hover {
      background: linear-gradient(135deg, #1a3a3a 0%, #0f2626 100%);
      border-color: #1a3a3a;
      box-shadow: 0 4px 12px rgba(45, 95, 95, 0.3);
    }
    
    .button-text {
      display: block;
      font-size: 18px;
      font-weight: 700;
    }
    
    /* Footer */
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer-content {
      font-size: 13px;
      color: #666;
      line-height: 1.8;
    }
    
    .footer-title {
      font-weight: 600;
      color: #1a3a3a;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .footer-contact {
      margin: 12px 0;
    }
    
    .footer-link {
      color: #2d5f5f;
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
    
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 16px 0;
    }
    
    .copyright {
      font-size: 12px;
      color: #999;
      margin-top: 16px;
    }
    
    /* Responsive design */
    @media (max-width: 600px) {
      .email-container {
        border-radius: 0;
      }
      
      .header {
        padding: 30px 15px;
      }
      
      .logo-text {
        font-size: 24px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .greeting {
        font-size: 18px;
      }
      
      .message {
        font-size: 15px;
      }
      
      .social-icons {
        gap: 15px;
      }
      
      .social-icon {
        width: 45px;
        height: 45px;
        line-height: 45px;
        font-size: 20px;
      }
      
      .verify-button {
        padding: 14px 40px;
        font-size: 15px;
      }
      
      .button-text {
        font-size: 16px;
      }
      
      .footer {
        padding: 20px 15px;
      }
      
      .footer-content {
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with branding -->
    <div class="header">
      <div class="logo-text">Marc's Trading Journal</div>
      <div class="logo-subtitle">PROFESSIONAL TRADING ANALYTICS</div>
    </div>
    
    <!-- Main content -->
    <div class="content">
      <div class="greeting">Welcome, ${name}!</div>
      <div class="message">
        Thank you for joining Marc's Trading Journal. To complete your registration and unlock full access to your trading analytics dashboard, please verify your email address by clicking the button below.
      </div>
      
      <!-- Social media section -->
      <div class="social-section">
        <div class="social-title">Follow Us</div>
        <div class="social-icons">
          <a href="https://facebook.com" class="social-icon facebook" title="Facebook">f</a>
          <a href="https://instagram.com" class="social-icon instagram" title="Instagram">📷</a>
          <a href="https://linkedin.com" class="social-icon linkedin" title="LinkedIn">in</a>
          <a href="https://twitter.com" class="social-icon twitter" title="Twitter/X">𝕏</a>
        </div>
      </div>
      
      <!-- Verify button -->
      <div class="button-container">
        <a href="${verificationLink}" class="verify-button">
          <span class="button-text">Verify Email</span>
        </a>
      </div>
      
      <div class="message" style="font-size: 13px; color: #999; margin-top: 24px;">
        If you didn't create this account, please ignore this email. This link will expire in 24 hours.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-title">Marc's Trading Journal</div>
      <div class="footer-content">
        <div class="footer-contact">
          📧 <a href="mailto:support@marcstradingjournal.com" class="footer-link">support@marcstradingjournal.com</a>
        </div>
        <div class="footer-contact">
          🌐 <a href="https://marcstradingjournal.com" class="footer-link">www.marcstradingjournal.com</a>
        </div>
        <div class="divider"></div>
        <div style="margin: 12px 0;">
          <a href="https://facebook.com" class="footer-link" style="margin: 0 8px;">Facebook</a> •
          <a href="https://instagram.com" class="footer-link" style="margin: 0 8px;">Instagram</a> •
          <a href="https://linkedin.com" class="footer-link" style="margin: 0 8px;">LinkedIn</a> •
          <a href="https://twitter.com" class="footer-link" style="margin: 0 8px;">Twitter</a>
        </div>
        <div class="copyright">
          © 2024 Marc's Trading Journal. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: "Marc's Trading Journal"
    },
    to: [{ address: email }],
    subject: "Verify Your Email - Marc's Trading Journal",
    html: htmlContent
  });
  
  $app.newMailClient().send(message);
  e.next();
}, "users");