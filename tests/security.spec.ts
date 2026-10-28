import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { e2eTitle } from "./helpers/cleanup";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const newClient = () =>
  createClient(url, key, { auth: { persistSession: false } });

test("người chưa đăng nhập không đọc/sửa/xóa/tạo được task", async () => {
  // 1. Đăng nhập bằng tài khoản test và tạo task canary
  const owner = newClient();
  const { data: auth, error: loginError } = await owner.auth.signInWithPassword(
    {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
  );
  expect(loginError).toBeNull();

  const id = `task-canary-${Date.now()}`;
  const title = e2eTitle(`canary ${Date.now()}`);

  const now = Date.now();
  const created = await owner
    .from("tasks")
    .insert({
      id,
      title,
      user_id: auth.user!.id,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  expect(created.error, created.error?.message).toBeNull();

  try {
    // 2. Người chưa đăng nhập thử tác động lên đúng task canary đó
    const anon = newClient();

    const read = await anon.from("tasks").select("id").eq("id", id);
    expect(read.data ?? []).toHaveLength(0);

    const update = await anon
      .from("tasks")
      .update({ title: "hacked" })
      .eq("id", id)
      .select("id");
    expect(update.data ?? []).toHaveLength(0);

    const del = await anon.from("tasks").delete().eq("id", id).select("id");
    expect(del.data ?? []).toHaveLength(0);

    const insert = await anon.from("tasks").insert({
      id: `${id}-anon`,
      title: e2eTitle("anon insert"),
      user_id: auth.user!.id,
      created_at: now,
      updated_at: now,
    });
    expect(insert.error).not.toBeNull();
    // 3. Task canary vẫn còn nguyên, tiêu đề không bị đổi
    const still = await owner
      .from("tasks")
      .select("title")
      .eq("id", id)
      .single();
    expect(still.data?.title).toBe(title);
  } finally {
    // 4. Luôn dọn canary, kể cả khi test fail
    await owner.from("tasks").delete().eq("id", id);
  }
});
