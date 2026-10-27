import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Nạp .env.local ở thư mục gốc (cùng cấp package.json)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const E2E_PREFIX = '[E2E]';

// Dùng trong test: e2eTitle('Mua sữa') => '[E2E] Mua sữa'
export const e2eTitle = (name: string) => `${E2E_PREFIX} ${name}`;

export async function cleanupE2ETasks(label: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !email || !password) {
    throw new Error(
      `[${label}] Thiếu biến môi trường (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD).`
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  console.log(`🧹 [${label}] Đăng nhập tài khoản E2E...`);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    throw new Error(`[${label}] Đăng nhập thất bại: ${authError.message}`);
  }

  console.log(`🧹 [${label}] Đang xóa các task ${E2E_PREFIX}...`);
  const { data, error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .like('title', `${E2E_PREFIX}%`)
    .select('id'); // để đếm số dòng thực sự đã bị xóa

  if (deleteError) {
    throw new Error(`[${label}] Lỗi khi xóa: ${deleteError.message}`);
  }

  console.log(`✅ [${label}] Đã xóa ${data?.length ?? 0} task E2E.`);
  await supabase.auth.signOut();
}