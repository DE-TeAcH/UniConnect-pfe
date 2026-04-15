import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'project.uniconnect@gmail.com',
        pass: 'zcpl abvb bhxv cthl',
    },
});

export async function sendPinEmail(to: string, pin: string, purpose: 'register' | 'reset') {
    const subject = purpose === 'register'
        ? 'UniConnect - Verify Your Email'
        : 'UniConnect - Password Reset PIN';

    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">UniConnect</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
                ${purpose === 'register' ? 'Email Verification' : 'Password Reset'}
            </p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">
                ${purpose === 'register'
            ? 'Use the PIN below to verify your email address and complete your registration.'
            : 'Use the PIN below to reset your password.'}
            </p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification PIN</p>
                <p style="color: #111827; font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 0; font-family: monospace;">${pin}</p>
            </div>
            <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 0 0 8px;">⏱ This PIN expires in 5 minutes</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} UniConnect — University Events Platform</p>
        </div>
    </div>`;

    await transporter.sendMail({
        from: '"UniConnect" <project.uniconnect@gmail.com>',
        to,
        subject,
        html,
    });
}
