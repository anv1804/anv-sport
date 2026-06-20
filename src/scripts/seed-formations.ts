import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function generateFormation(name: string) {
  const parts = name.split('-').map(Number);
  const players = [];
  const N = parts.length;
  
  // GK is always at Y=8%, X=50%
  players.push({ x: 50, y: 8, role: 'GK' });
  
  for (let i = 0; i < N; i++) {
    const count = parts[i];
    let y = 50;
    if (N > 1) {
      y = 25 + (60 / (N - 1)) * i; 
    }
    
    for (let j = 0; j < count; j++) {
      const x = (100 / (count + 1)) * (j + 1);
      players.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
  }
  return players;
}

const formations = [
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "3-5-2",
  "3-4-3",
  "5-3-2",
  "4-1-4-1",
  "4-3-2-1",
  "4-4-1-1",
  "3-4-2-1",
  "4-5-1",
  "5-4-1"
];

async function run() {
  // Use DIRECT_URL for migrations/DDL if available, else DATABASE_URL without pgbouncer
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL?.replace('?pgbouncer=true', '');
  
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase.");

    await client.query(`
      ALTER TABLE public.tactical_formations ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public read access for tactical_formations" ON public.tactical_formations;
      
      CREATE POLICY "Public read access for tactical_formations"
          ON public.tactical_formations
          FOR SELECT
          USING (true);
    `);
    
    console.log("RLS setup complete.");

    for (const name of formations) {
      const coords = generateFormation(name);
      
      await client.query(`
        INSERT INTO public.tactical_formations (name, coordinates)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE 
        SET coordinates = EXCLUDED.coordinates
      `, [name, JSON.stringify(coords)]);
      
      console.log(`Seeded ${name}`);
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
