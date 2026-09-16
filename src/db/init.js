import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pool from './pool.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
export async function initDatabase(){const sql=await fs.readFile(path.join(dir,'schema.sql'),'utf8');await pool.query(sql);console.log('PostgreSQL schema is ready.');}
if(process.argv[1]===fileURLToPath(import.meta.url)){initDatabase().then(()=>pool.end()).catch(e=>{console.error(e);process.exit(1);});}
