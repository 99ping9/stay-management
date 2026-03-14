
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data, error } = await supabase.from('scheduled_messages').select('*').limit(1);
  console.log('Columns:', Object.keys(data[0] || {}).length > 0 ? Object.keys(data[0]) : 'No data, checking rpc...');
  
  // If no data, try to query information_schema if possible (rare)
  const { data: cols, error: err2 } = await supabase.rpc('get_column_names', { table_name: 'scheduled_messages' });
  if (cols) console.log('RPC Columns:', cols);
}

check();
