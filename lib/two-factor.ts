import bcrypt from 'bcryptjs';

import { supabaseAdmin } from './supabase';

export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function store2FACode(userId: string, code: string) {
  // Store in database with 10-minute expiration
  await supabaseAdmin
    .from('two_factor_codes')
    .insert({
      user_id: userId,
      code: await bcrypt.hash(code, 10),
      expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });
}

export async function verify2FACode(userId: string, code: string): Promise<boolean> {
  try {
    const { data: storedCode, error } = await supabaseAdmin
      .from('two_factor_codes')
      .select('code, expires_at, used')
      .eq('user_id', userId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !storedCode) {
      return false;
    }

    const isValid = await bcrypt.compare(code, storedCode.code);
    
    if (isValid) {
      // Mark code as used
      await supabaseAdmin
        .from('two_factor_codes')
        .update({ used: true })
        .eq('user_id', userId)
        .eq('code', storedCode.code);
    }

    return isValid;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('2FA verification error:', error);
    return false;
  }
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
  }
  return codes;
}
