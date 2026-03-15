// Simple test to hit the admin attendance class sessions endpoint
import http from 'http';
const options = {
   hostname: 'localhost',
   port: 5000,
   path: '/api/admin/attendances/sessions/class/invalidId',
   method: 'GET',
};
const req = http.request(options, (res) => {
   let data = '';
   res.on('data', (c) => { data += c; });
   res.on('end', () => { console.log('STATUS:', res.statusCode); });
});
req.on('error', (e) => { console.error('ERR:', e.message); });
req.end();
