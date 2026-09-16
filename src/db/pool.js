import pg from 'pg';
import config from '../config.js';
const {Pool}=pg;
const pool=new Pool({connectionString:config.databaseUrl,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
pool.on('error',e=>console.error('PostgreSQL pool error:',e));
export default pool;
