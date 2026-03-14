
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data, error } = await supabase.rpc('inspect_triggers'); // Custom RPC? Maybe not exists
  if (error) {
     // Fallback: try to see if we can query pg_trigger via raw sql if enabled, 
     // but usually we can't via REST API.
     // Let's just check if we can see any table definition clues.
     console.log('Cant check triggers via RPC');
  } else {
     console.log(JSON.stringify(data, null, 2));
  }
}

check();
