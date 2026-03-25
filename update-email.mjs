import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ixmaeqxupafdfonyyygn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const tables = ['users', 'profiles', 'admin', 'admins', 'managers'];
  const results = {};
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(10);
    if (!error) {
      results[table] = data;
    } else if (error.code !== '42P01') {
      results[table] = { error: error.message };
    }
  }
  
  fs.writeFileSync('tables.json', JSON.stringify(results, null, 2));
  console.log('Saved to tables.json');
}

checkTables();
