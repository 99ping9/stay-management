
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data: templates, error: tplError } = await supabase
        .from('message_templates')
        .select('*');
    
    if (tplError) {
        console.error(tplError);
        return;
    }
    
    console.log('TEMPLATES_START');
    templates.forEach(t => {
        console.log(`ID: ${t.id} | Title: ${t.title} | Time: ${t.send_time} | Type: ${t.trigger_type}`);
    });
    console.log('TEMPLATES_END');

    const { data: messages, error: msgError } = await supabase
        .from('scheduled_messages')
        .select(`
            id,
            scheduled_at,
            status,
            template:message_templates(title)
        `)
        .order('scheduled_at', { ascending: true });

    if (msgError) {
        console.error(msgError);
        return;
    }

    console.log('MESSAGES_START');
    messages.forEach(m => {
        console.log(`ID: ${m.id} | At: ${m.scheduled_at} | Status: ${m.status} | Title: ${m.template?.title}`);
    });
    console.log('MESSAGES_END');
}

check();
