
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envLocalPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('message_templates').select('title, send_time');
    data.forEach(t => console.log(t.title + ' : ' + t.send_time));
}
run();
