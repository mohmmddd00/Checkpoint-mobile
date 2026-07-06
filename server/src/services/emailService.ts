// import nodemailer from "nodemailer";

// export const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   family: 4,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// } as nodemailer.TransportOptions);

// export async function sendPasswordResetEmail(
//   toEmail: string,
//   resetToken: string
// ): Promise<void> {
//   const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
//   const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

//   await transporter.sendMail({
//     from: `"Checkpoint" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Reset your Checkpoint password",
//     html: `
//       <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//         <h2 style="color: #32050F;">Reset Your Password</h2>
//         <p>We received a request to reset the password for your Checkpoint account.</p>
//         <p>Click the button below to choose a new password. This link will expire in <strong>30 minutes</strong>.</p>
//         <a href="${resetLink}"
//            style="display:inline-block;margin-top:16px;padding:12px 24px;background:#32050F;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
//           Reset my password
//         </a>
//         <p style="margin-top:24px;color:#888;font-size:13px;">
//           If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
//         </p>
//       </div>
//     `,
//   });
// }

// export async function sendVerificationEmail(
//   toEmail: string,
//   verificationToken: string
// ): Promise<void> {
//   const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
//   const verificationLink = `${clientUrl}/verification-confirmation?token=${verificationToken}`;

//   await transporter.sendMail({
//     from: `"Checkpoint" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Verify your Checkpoint account",
//     html: `
//       <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//         <h2 style="color: #32050F;">Welcome to Checkpoint!</h2>
//         <p>Thanks for registering. Please verify your email address by clicking the button below.</p>
//         <p>This link will expire in <strong>30 minutes</strong>.</p>
//         <a href="${verificationLink}"
//            style="display:inline-block;margin-top:16px;padding:12px 24px;background:#32050F;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
//           Verify my email
//         </a>
//         <p style="margin-top:24px;color:#888;font-size:13px;">
//           If you did not create a Checkpoint account, you can safely ignore this email.
//         </p>
//       </div>
//     `,
//   });
// }















const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  console.log("[BREVO] URL:", BREVO_API_URL);
  console.log("[BREVO] API KEY:", process.env.BREVO_API_KEY ? "found" : "missing");
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY || "",
    },
    body: JSON.stringify({
      sender: { name: "Checkpoint", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[BREVO HTTP ERROR]", text);
    throw new Error(`Brevo API error: ${response.status} - ${text}`);
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  await sendEmail(
    toEmail,
    "Reset your Checkpoint password",
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #32050F;">Reset Your Password</h2>
        <p>We received a request to reset the password for your Checkpoint account.</p>
        <p>Click the button below to choose a new password. This link will expire in <strong>30 minutes</strong>.</p>
        <a href="${resetLink}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#32050F;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Reset my password
        </a>
        <p style="margin-top:24px;color:#888;font-size:13px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </div>
    `
  );
}

export async function sendVerificationEmail(
  toEmail: string,
  verificationToken: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verificationLink = `${clientUrl}/verification-confirmation?token=${verificationToken}`;

  await sendEmail(
    toEmail,
    "Verify your Checkpoint account",
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #32050F;">Welcome to Checkpoint!</h2>
        <p>Thanks for registering. Please verify your email address by clicking the button below.</p>
        <p>This link will expire in <strong>30 minutes</strong>.</p>
        <a href="${verificationLink}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#32050F;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Verify my email
        </a>
        <p style="margin-top:24px;color:#888;font-size:13px;">
          If you did not create a Checkpoint account, you can safely ignore this email.
        </p>
      </div>
    `
  );
}