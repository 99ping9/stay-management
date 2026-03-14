
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixmaeqxupafdfonyyygn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bWFlcXh1cGFmZGZvbnl5eWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxMzcxMSwiZXhwIjoyMDg2Mjg5NzExfQ.mrXTxeJi8RQr7sfSDqu1P4hxtxoTr6wFzZi5CMs2ogQ'
);

async function testQuery() {
  const businessId = 1;

  const { data, error } = await supabase
    .from("scheduled_messages")
    .select(`
      id,
      status,
      scheduled_at,
      sent_at,
      error_message,
      reservation:reservations!inner ( guest_name, phone, room:rooms(name), business_id ),
      template:message_templates ( title, trigger_type )
    `)
    .eq("reservation.business_id", businessId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    console.error('QUERY ERROR:', error);
  } else {
    console.log('QUERY RESULT:', JSON.stringify(data, null, 2));
  }
}

testQuery();
