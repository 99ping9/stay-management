
const crypto = require('crypto');
const http = require('https');

const apiKey = 'NCSFZ6W2M6GUR3E7';
const apiSecret = 'QJTSK8U88A8L0X4OOM9Z5M0H9Y4XF3R0';
const imageUrl = 'https://ixmaeqxupafdfonyyygn.supabase.co/storage/v1/object/public/stay-management/templates/checkin.jpg';

function getSolapiAuthHeader(apiKey, apiSecret) {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
    return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

async function testUpload() {
    try {
        console.log('Fetching image...');
        const buffer = await fetchImage(imageUrl);
        const base64 = buffer.toString('base64');
        console.log('Image fetched, base64 length:', base64.length);

        const authHeader = getSolapiAuthHeader(apiKey, apiSecret);
        
        const options = {
            hostname: 'api.solapi.com',
            path: '/storage/v1/files',
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                console.log('Body:', body);
            });
        });

        req.on('error', (e) => console.error(e));
        req.write(JSON.stringify({
            file: base64,
            type: 'MMS'
        }));
        req.end();

    } catch (err) {
        console.error('TEST FAIL:', err);
    }
}

testUpload();
