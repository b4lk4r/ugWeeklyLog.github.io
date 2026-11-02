import 'dotenv/config';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
export async function migrate(){const c=await pool.connect();try{await c.query('BEGIN');await c.query("SELECT pg_advisory_xact_lock(4180001)");await c.query('CREATE TABLE IF NOT EXISTS migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');for(const name of ['001.sql','002.sql','003.sql','004.sql']){if(!(await c.query('SELECT 1 FROM migrations WHERE name=$1',[name])).rowCount){await c.query(await readFile(new URL('./migrations/'+name,import.meta.url),'utf8'));await c.query('INSERT INTO migrations(name) VALUES($1)',[name]);}}await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
