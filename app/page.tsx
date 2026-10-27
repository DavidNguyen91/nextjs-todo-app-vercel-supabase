import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { TaskApp } from '@/components/TaskApp';
import styles from './page.module.css';

export default async function HomePage() {
  const isTestEnvironment = process.env.PLAYWRIGHT_TEST === '1';

  let hasAuthenticatedUser = false;

  // In test mode, allow test session cookie
  if (isTestEnvironment) {
    const cookieStore = await cookies();
    if (cookieStore.get('e2e_test_session')?.value) {
      hasAuthenticatedUser = true;
    }
  }

  if (!hasAuthenticatedUser) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        hasAuthenticatedUser = true;
      }
    } catch {
      hasAuthenticatedUser = false;
    }
  }

  if (!hasAuthenticatedUser) {
    redirect('/login');
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <TaskApp />

        <footer className={styles.footer}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            <span>Supabase Cloud &amp; Offline Sync Enabled</span>
          </div>
          <p>Designed with Apple Human Interface principles. Pure CSS &amp; Next.js App Router.</p>
        </footer>
      </div>
    </main>
  );
}
