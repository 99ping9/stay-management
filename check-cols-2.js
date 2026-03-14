
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data } = await supabase.from('scheduled_messages').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in scheduled_messages:', Object.keys(data[0]));
  } else {
    // try to insert and then check
    const { data: d2 } = await supabase.from('scheduled_messages').insert({
       reservation_id: 1, // hope 1 exists
       status: 'pending'
    }).select();
    if (d2) console.log('Columns via insert:', Object.keys(d2[0]));
  }
}

check();
