import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();

/**
 * Verifies a Firebase ID token and confirms the user is an authorized admin.
 * Checks against process.env.ADMIN_EMAILS and ensures valid authentication
 * provider ('password') or verified email status. Throws a 403 error if unauthorized.
 */
export async function verifyAdminToken(idToken: string) {
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const adminEmails = (process.env.ADMIN_EMAILS || 'priyanshu@redflaghomes.in')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const email = (decodedToken.email || '').toLowerCase();
  const isEmailAdmin = adminEmails.includes(email);
  const isVerifiedOrPassword =
    decodedToken.email_verified === true ||
    decodedToken.firebase?.sign_in_provider === 'password';

  if (!isEmailAdmin || !isVerifiedOrPassword) {
    const error: any = new Error('Not an admin');
    error.status = 403;
    error.statusCode = 403;
    throw error;
  }

  return decodedToken;
}
