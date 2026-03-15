const http = require('http');

const data = JSON.stringify({
    id: "1",
    name: 'Test Update Port 3000'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/update',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, res => {
    let body = '';
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', d => {
        body += d;
    });
    res.on('end', () => {
        console.log(body);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
