import { cleanupE2ETasks } from './helpers/cleanup';

export default async function globalSetup() {
  // Dọn dữ liệu sót từ lần chạy trước (nếu bị crash)
  await cleanupE2ETasks('setup');
}