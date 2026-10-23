'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { UserIcon, CloudIcon, GoogleIcon, CloseIcon } from './Icons';
import styles from './AuthButton.module.css';

export function AuthButton() {
  const { user, isLoading, isConfigured, signInWithGoogle, signInWithOtp, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isLoading) {
    return null;
  }

  if (user) {
    const initials = (user.email?.[0] || 'U').toUpperCase();
    return (
      <div className={styles.authContainer}>
        <div className={styles.userPill}>
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
          <span className={styles.userEmail} title={user.email ?? ''}>
            {user.email}
          </span>
          <span className={styles.cloudSyncBadge} title="Tasks synced to Supabase Cloud">
            <CloudIcon size={14} />
          </span>
          <button
            type="button"
            className={styles.signOutLink}
            onClick={() => signOut()}
            aria-label="Sign out of account"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setMessage(`Sign-in error: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);
    const { error } = await signInWithOtp(email.trim());
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the magic sign-in link!');
      setEmail('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.authContainer}>
      <button
        type="button"
        className={styles.signInButton}
        onClick={() => setIsOpen(true)}
        aria-label="Sign in to your account"
      >
        <UserIcon size={14} />
        <span>Sign In</span>
      </button>

      {isOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className={styles.modalContent}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close dialog"
            >
              <CloseIcon size={15} />
            </button>

            <h2 id="auth-modal-title" className={styles.modalTitle}>
              Sign In to Tasks
            </h2>
            <p className={styles.modalDescription}>
              Sync your tasks across your Mac, iPhone, and web in real-time.
            </p>

            {!isConfigured ? (
              <div className={styles.noticeAlert}>
                <strong>Supabase credentials needed:</strong>
                <p>
                  To enable Google sign-in and cloud sync, provide your Supabase URL and Anon Key in:
                </p>
                <code className={styles.noticeCode}>.env.local</code>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.googleButton}
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <GoogleIcon size={18} />
                  <span>Continue with Google</span>
                </button>

                <div className={styles.divider}>
                  <span className={styles.dividerSpan}>or email link</span>
                </div>

                <form onSubmit={handleEmailSignIn} className={styles.emailForm}>
                  <input
                    type="email"
                    className={styles.emailInput}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className={styles.submitEmailButton}
                    disabled={isSubmitting || !email.trim()}
                  >
                    Send Magic Link
                  </button>
                </form>

                {message && (
                  <div className={styles.feedbackMessage} role="status">
                    {message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
