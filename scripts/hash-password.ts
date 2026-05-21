#!/usr/bin/env tsx
import { hashPassword } from "../lib/auth/password";

async function main() {
  const plain = process.argv[2];
  if (!plain) {
    console.error("Usage: npm run hash-password -- <password>");
    process.exit(1);
  }
  const hash = await hashPassword(plain);
  console.log(hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
