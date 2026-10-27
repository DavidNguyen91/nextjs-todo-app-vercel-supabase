import { cleanupE2ETasks } from './helpers/cleanup';

export default async function globalTeardown() {
  await cleanupE2ETasks('teardown');
}