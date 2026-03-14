
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data: templates } = await supabase.from('message_templates').select('*');
  console.log('TEMPLATES COUNT:', templates.length);
  templates.forEach(t => {
    console.log(`ID: ${t.id}, Active: ${t.is_active}, Trigger: ${t.trigger_type}, Time: ${t.send_time}`);
  });

  const { data: messages } = await supabase.from('scheduled_messages').select('*');
  console.log('MESSAGES COUNT:', messages.length);
  messages.forEach(m => {
    console.log(`ID: ${m.id}, ResID: ${m.reservation_id}, Status: ${m.status}, ScheduledAt: ${m.scheduled_at}`);
  });
}

check();
