import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding QueueJump database...");

  // 1. Demo Tenant
  const demoEmail = "demo@queuejump.dev";
  const passwordHash = await bcrypt.hash("demopassword123", 10);

  const tenant = await prisma.tenant.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: "QueueJump Demo Founder",
      email: demoEmail,
      passwordHash,
    },
  });

  console.log(`Demo tenant ready: ${tenant.email} (${tenant.id})`);

  // 2. Demo Campaign for Interactive Hero Playground
  const demoPublicKey = "pk_live_demo_queuejump";
  const demoSecretKey = "sk_live_demo_secret_key_queuejump_2026";
  const demoSecretKeyHash = crypto.createHash("sha256").update(demoSecretKey).digest("hex");

  const milestones = [
    { count: 3, reward: "Priority Early Access" },
    { count: 5, reward: "Free Pro Tier for 1 Year" },
    { count: 10, reward: "Founder Swag Box + Lifetime VIP" },
  ];

  const campaign = await prisma.campaign.upsert({
    where: { publicKey: demoPublicKey },
    update: {
      isDemo: true,
      milestonesJson: JSON.stringify(milestones),
    },
    create: {
      tenantId: tenant.id,
      name: "QueueJump Cloud Beta (Live Playground)",
      publicKey: demoPublicKey,
      secretKeyHash: demoSecretKeyHash,
      webhookSecret: "whsec_demo_signature_secret_test",
      referralBonusSec: 86400, // 24 hours per verified referral
      milestonesJson: JSON.stringify(milestones),
      isDemo: true,
    },
  });

  console.log(`Demo campaign ready: ${campaign.name}`);
  console.log(`  Public Key: ${campaign.publicKey}`);
  console.log(`  Campaign ID: ${campaign.id}`);
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });