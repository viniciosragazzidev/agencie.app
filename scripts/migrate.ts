import postgres from "postgres"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const url = process.env.DATABASE_URL!
if (!url) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

async function migrate() {
  const client = postgres(url, { prepare: false })
  
  console.log("Running migration...")

  // Create agency_settings table
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS "agency_settings" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL,
      "agency_name" text,
      "agency_logo" text,
      "agency_slogan" text,
      "primary_color" text DEFAULT '#111827',
      "secondary_color" text DEFAULT '#6b7280',
      "accent_color" text DEFAULT '#3b82f6',
      "cnpj" text,
      "address" text,
      "phone" text,
      "email" text,
      "website" text,
      "default_contract_template" text DEFAULT 'prestacao_servicos',
      "contract_footer" text,
      "clause_bank" jsonb,
      "portal_welcome_message" text,
      "portal_primary_action" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "agency_settings_user_id_unique" UNIQUE("user_id")
    )
  `)
  console.log("Created agency_settings table")

  // Add foreign key
  await client.unsafe(`
    DO $$ BEGIN
      ALTER TABLE "agency_settings" ADD CONSTRAINT "agency_settings_user_id_user_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  console.log("Added agency_settings foreign key")

  // Add new columns to client_contract
  const contractColumns = [
    { name: "contract_type", def: "text DEFAULT 'prestacao_servicos'" },
    { name: "validity_days", def: "integer DEFAULT 30" },
    { name: "project_id", def: "text" },
    { name: "total_value", def: "text" },
    { name: "payment_conditions", def: "text" },
    { name: "late_fee", def: "text" },
    { name: "expires_at", def: "timestamp" },
  ]

  for (const col of contractColumns) {
    await client.unsafe(`
      DO $$ BEGIN
        ALTER TABLE "client_contract" ADD COLUMN "${col.name}" ${col.def};
      EXCEPTION WHEN duplicate_column THEN null;
      END $$;
    `)
    console.log(`Added column: client_contract.${col.name}`)
  }

  // Add onboarding fields to user table
  const onboardingColumns = [
    { name: "onboarding_completed", def: "boolean DEFAULT false NOT NULL" },
    { name: "onboarding_step", def: "integer DEFAULT 0 NOT NULL" },
    { name: "setup_progress", def: "jsonb DEFAULT '{\"agencyConfigured\":false,\"firstClientCreated\":false,\"firstServiceCreated\":false,\"integrationConnected\":false,\"contractGenerated\":false}'::jsonb" },
    { name: "tutorial_completed", def: "boolean DEFAULT false NOT NULL" },
    { name: "last_login_at", def: "timestamp" },
    { name: "login_count", def: "integer DEFAULT 0 NOT NULL" },
  ]

  for (const col of onboardingColumns) {
    await client.unsafe(`
      DO $$ BEGIN
        ALTER TABLE "user" ADD COLUMN "${col.name}" ${col.def};
      EXCEPTION WHEN duplicate_column THEN null;
      END $$;
    `)
    console.log(`Added column: user.${col.name}`)
  }

  await client.end()
  console.log("\nMigration complete!")
}

migrate().catch(console.error)
