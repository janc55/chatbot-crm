const http = require('http');

const TOTAL_REQUESTS = 500;
const CONCURRENCY = 20;

let completed = 0;
let errors = 0;
let start = Date.now();

console.log(`Starting Load Test: ${TOTAL_REQUESTS} requests, concurrency ${CONCURRENCY} to http://localhost:3000/leads`);

function makeRequest() {
    return new Promise((resolve) => {
        http.get('http://localhost:3000/leads', (res) => {
            res.resume(); // Consume body
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Success
            } else {
                errors++;
            }
            resolve();
        }).on('error', (e) => {
            errors++;
            resolve();
        });
    });
}

async function worker() {
    while (completed < TOTAL_REQUESTS) {
        completed++;
        await makeRequest();
        if (completed % 50 === 0) process.stdout.write('.');
    }
}

async function run() {
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    const duration = (Date.now() - start) / 1000;
    console.log(`\n\nDone!`);
    console.log(`Time: ${duration.toFixed(2)}s`);
    console.log(`RPS: ${(TOTAL_REQUESTS / duration).toFixed(2)} req/s`);
    console.log(`Errors: ${errors}`);
}

run();
