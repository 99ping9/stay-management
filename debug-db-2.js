
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data: messages, error } = await supabase
    .from('scheduled_messages')
    .select('count', { count: 'exact' });
  console.log('Total scheduled messages:', messages);
  
  const { data: recent, error: err2 } = await supabase
    .from('scheduled_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent messages:', JSON.stringify(recent, null, 2));

  const { data: templates, error: err3 } = await supabase
    .from('message_templates')
    .select('*');
  console.log('Templates:', JSON.stringify(templates, null, 2));
}

check();
