import { Resend } from 'resend';

import { debugEmail, logError } from './debug';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function sendVerificationEmail(email: string, token: string, name: string) {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
    
    debugEmail('Sending verification email', {
      to: email,
      name,
      token: token.substring(0, 8) + '...',
      verificationUrl
    });
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}!</h1>
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    debugEmail('Verification email sent successfully', {
      emailId: result.id,
      to: email
    });

    return result;
  } catch (error) {
    logError(error, 'sendVerificationEmail');
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
    
    debugEmail('Sending password reset email', {
      to: email,
      name,
      token: token.substring(0, 8) + '...',
      resetUrl
    });
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    debugEmail('Password reset email sent successfully', {
      emailId: result.id,
      to: email
    });

    return result;
  } catch (error) {
    logError(error, 'sendPasswordResetEmail');
    throw error;
  }
}

export async function send2FACode(email: string, code: string, name: string) {
  try {
    debugEmail('Sending 2FA code email', {
      to: email,
      name,
      code: code.substring(0, 2) + '****'
    });
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Your verification code',
      html: `
        <h1>Two-Factor Authentication Code</h1>
        <p>Hi ${name},</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `
    });

    debugEmail('2FA code email sent successfully', {
      emailId: result.id,
      to: email
    });

    return result;
  } catch (error) {
    logError(error, 'send2FACode');
    throw error;
  }
}
