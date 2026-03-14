
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function check() {
  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*, reservation:reservations(*)');
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SCHEDULED MESSAGES WITH RESERVATIONS:');
    data.forEach(m => {
      console.log(`MsgID: ${m.id} | ResID: ${m.reservation_id} | BusinessID: ${m.reservation?.business_id}`);
    });
  }
}

check();
