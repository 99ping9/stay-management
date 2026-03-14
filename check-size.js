
const http = require('https');
const url = 'https://ixmaeqxupafdfonyyygn.supabase.co/storage/v1/object/public/stay-management/templates/checkin.jpg';

http.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers['content-length']);
    res.on('data', () => {}); // consume
});
