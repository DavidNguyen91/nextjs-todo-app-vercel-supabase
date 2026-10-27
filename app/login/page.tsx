'use client';

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { GoogleIcon } from '@/components/Icons';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  // Thêm signUpWithPassword vào hook useAuth (đảm bảo useAuth của bạn đã export hàm này)
  const { user, isLoading, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // Thông báo khi đăng ký thành công
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Trạng thái chuyển đổi qua lại giữa Đăng nhập và Đăng ký
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error.message);
      setIsSubmitting(false);
    }
  };

  // Hàm xử lý chung cho cả Đăng nhập & Đăng ký bằng Email
  const handleSubmitAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isSignUpMode) {
      // 🟢 Xử lý Đăng ký tài khoản mới
      if (typeof signUpWithPassword !== 'function') {
        setErrorMsg('Hàm đăng ký chưa được cấu hình trong useAuth.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await signUpWithPassword(email.trim(), password);
      if (error) {
        setErrorMsg(error.message);
        setIsSubmitting(false);
      } else {
        setSuccessMsg('Account created successfully! Please check your email to verify your account, or sign in below.');
        setIsSubmitting(false);
        setIsSignUpMode(false); // Chuyển lại form đăng nhập sau khi đăng ký thành công
      }
    } else {
      // 🔵 Xử lý Đăng nhập thông thường
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) {
        setErrorMsg(error.message);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.brand}>Tasks</span>
          <h1 className={styles.title}>
            {isSignUpMode ? 'Create an account' : 'Sign in to your account'}
          </h1>
          <p className={styles.subtitle}>
            {isSignUpMode 
              ? 'Sign up to start organizing and syncing your tasks securely.' 
              : 'Sign in to access and sync your tasks securely.'}
          </p>
        </div>

        {errorMsg && (
          <div className={styles.errorMessage} role="alert" data-testid="auth-error">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className={styles.successMessage} role="status" data-testid="auth-success" style={{ color: 'green', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {successMsg}
          </div>
        )}

        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          data-testid="google-signin-btn"
        >
          <GoogleIcon size={18} />
          <span>Continue with Google</span>
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerText}>or with email</span>
        </div>

        <form onSubmit={handleSubmitAuth} className={styles.form} data-testid="login-form">
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="email"
              data-testid="email-input"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !email.trim() || !password}
            data-testid="submit-btn"
          >
            {isSubmitting 
              ? (isSignUpMode ? 'Signing up…' : 'Signing in…') 
              : (isSignUpMode ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Nút chuyển đổi qua lại giữa Đăng nhập và Đăng ký */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {isSignUpMode ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUpMode(false); setErrorMsg(null); setSuccessMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUpMode(true); setErrorMsg(null); setSuccessMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>Protected by Supabase Auth &amp; Row Level Security</p>
      </footer>
    </main>
  );
}