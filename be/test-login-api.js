const http = require('http');

const data = JSON.stringify({
   email: 'admin@ecms.com',
   password: '123456'
});

const options = {
   hostname: 'localhost',
   port: 5000,
   path: '/api/auth/login',
   method: 'POST',
   headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
   }
};

const req = http.request(options, res => {
   console.log(`statusCode: ${res.statusCode}`);
   let responseBody = '';

   res.on('data', d => {
      responseBody += d;
   });

   res.on('end', () => {
      console.log('Response:', responseBody);
   });
});

req.on('error', error => {
   console.error(error);
});

req.write(data);
req.end();
