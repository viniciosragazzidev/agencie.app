import postgres from "postgres"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const url = process.env.DATABASE_URL!
if (!url) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

async function reset() {
  const client = postgres(url, { prepare: false })
  
  console.log("Dropping all tables...")
  
  // Get all table names
  const tables = await client.unsafe(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `)
  
  // Disable foreign key checks and drop all tables
  await client.unsafe("SET session_replication_role = 'replica'")
  
  for (const row of tables) {
    await client.unsafe(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`)
    console.log(`  Dropped: ${row.tablename}`)
  }
  
  await client.unsafe("SET session_replication_role = 'origin'")
  
  // Also drop enums
  const enums = await client.unsafe(`
    SELECT typname FROM pg_type 
    WHERE typbase = 0 AND typcategory = 'E'
  `)
  for (const row of enums) {
    await client.unsafe(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`)
    console.log(`  Dropped enum: ${row.typname}`)
  }
  
  await client.end()
  console.log("\nAll tables dropped. Now run: npm run db:push")
}

reset().catch(console.error)
