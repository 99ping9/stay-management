
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data: res } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });
  console.log('RESERVATIONS:', JSON.stringify(res, null, 2));

  const { data: templates } = await supabase.from('message_templates').select('*');
  console.log('TEMPLATES:', JSON.stringify(templates, null, 2));

  const { data: messages } = await supabase.from('scheduled_messages').select('*');
  console.log('MESSAGES:', JSON.stringify(messages, null, 2));
}

check();
