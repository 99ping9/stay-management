
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const apiKey = 'NCSFZ6W2M6GUR3E7';
const apiSecret = 'QJTSK8U88A8L0X4OOM9Z5M0H9Y4XF3R0';
const imageUrl = 'https://ixmaeqxupafdfonyyygn.supabase.co/storage/v1/object/public/stay-management/templates/checkin.jpg';

function getSolapiAuthHeader(apiKey, apiSecret) {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
    return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function testUpload() {
    try {
        console.log('Fetching image...');
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error('Failed to fetch image: ' + imageRes.statusText);
        const buffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        console.log('Image fetched, base64 length:', base64.length);

        const authHeader = getSolapiAuthHeader(apiKey, apiSecret);
        console.log('Auth Header:', authHeader);

        const uploadRes = await fetch('https://api.solapi.com/storage/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file: base64,
                type: 'MMS'
            })
        });

        const result = await uploadRes.json();
        console.log('Upload Result Status:', uploadRes.status);
        console.log('Upload Result Body:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('TEST FAIL:', err);
    }
}

testUpload();
