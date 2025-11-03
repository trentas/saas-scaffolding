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
      emailId: result.data?.id,
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
      emailId: result.data?.id,
      to: email
    });

    return result;
  } catch (error) {
    logError(error, 'sendPasswordResetEmail');
    throw error;
  }
}

export async function sendInvitationEmail(
  email: string, 
  token: string, 
  organizationName: string, 
  inviterName: string
) {
  try {
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;
    
    debugEmail('Sending invitation email', {
      to: email,
      organizationName,
      inviterName,
      token: token.substring(0, 8) + '...',
      invitationUrl
    });
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `You've been invited to join ${organizationName}`,
      html: `
        <h1>You've been invited to join ${organizationName}!</h1>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on ${process.env.NEXT_PUBLIC_APP_NAME}.</p>
        <p>Click the button below to accept the invitation:</p>
        <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${invitationUrl}">${invitationUrl}</a></p>
        <p><strong>This invitation will expire in 7 days.</strong></p>
        <p>If you don't have an account yet, you'll be able to create one when you accept the invitation.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `
    });

    debugEmail('Invitation email sent successfully', {
      emailId: result.data?.id,
      to: email,
      organizationName
    });

    return result;
  } catch (error) {
    logError(error, 'sendInvitationEmail');
    throw error;
  }
}

export async function sendOwnershipTransferEmail(
  email: string,
  organizationName: string,
  newOwnerName: string,
  previousOwnerName: string
) {
  try {
    debugEmail('Sending ownership transfer email', {
      to: email,
      organizationName,
      newOwnerName,
      previousOwnerName
    });
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `You're now the owner of ${organizationName}`,
      html: `
        <h1>Congratulations! You're now the owner of ${organizationName}</h1>
        <p>Hi ${newOwnerName},</p>
        <p><strong>${previousOwnerName}</strong> has transferred ownership of <strong>${organizationName}</strong> to you.</p>
        <p>As the new owner, you now have full control of the organization and can:</p>
        <ul>
          <li>Manage all organization settings</li>
          <li>Invite and remove team members</li>
          <li>Change member roles and permissions</li>
          <li>Transfer ownership to another member</li>
          <li>Delete the organization</li>
        </ul>
        <p>To manage your organization, visit your dashboard:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
        <p>If you have any questions or concerns, please don't hesitate to reach out.</p>
        <p>Best regards,<br>The ${process.env.NEXT_PUBLIC_APP_NAME} Team</p>
      `
    });

    debugEmail('Ownership transfer email sent successfully', {
      emailId: result.data?.id,
      to: email,
      organizationName
    });

    return result;
  } catch (error) {
    logError(error, 'sendOwnershipTransferEmail');
    throw error;
  }
}
