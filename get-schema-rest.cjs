const https = require('https');

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'qfneoowktsirwpzehgxp.supabase.co',
      port: 443,
      path: `/rest/v1/${path}`,
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function inspectSchema() {
  console.log('='.repeat(80));
  console.log('SCHEMA INSPECTION VIA POSTGREST API');
  console.log('='.repeat(80));
  console.log();

  // Try to get the OpenAPI spec which contains all table definitions
  console.log('Fetching OpenAPI specification...\n');

  try {
    const openApiReq = await makeRequest('');
    console.log('Response status:', openApiReq.status);
    console.log('Response headers:', openApiReq.headers);
    console.log('Response body:', JSON.stringify(openApiReq.body, null, 2).substring(0, 1000));
  } catch (err) {
    console.log('Error fetching OpenAPI:', err.message);
  }

  console.log('\n' + '─'.repeat(80) + '\n');

  // Known tables
  const tables = ['patients', 'visits', 'users'];

  for (const table of tables) {
    console.log(`TABLE: ${table}`);
    console.log('─'.repeat(40));

    try {
      // Get with OPTIONS to see available columns
      const optionsReq = new Promise((resolve, reject) => {
        const options = {
          hostname: 'qfneoowktsirwpzehgxp.supabase.co',
          port: 443,
          path: `/rest/v1/${table}`,
          method: 'OPTIONS',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        };

        const req = https.request(options, (res) => {
          resolve({ status: res.statusCode, headers: res.headers });
        });

        req.on('error', reject);
        req.end();
      });

      const optionsRes = await optionsReq;
      console.log('Accept-Profile:', optionsRes.headers['accept-profile']);
      console.log('Allow methods:', optionsRes.headers['allow']);

      // Try HEAD request to get column info
      const headReq = new Promise((resolve, reject) => {
        const options = {
          hostname: 'qfneoowktsirwpzehgxp.supabase.co',
          port: 443,
          path: `/rest/v1/${table}?limit=0`,
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'count=exact'
          }
        };

        const req = https.request(options, (res) => {
          resolve({ status: res.statusCode, headers: res.headers });
        });

        req.on('error', reject);
        req.end();
      });

      const headRes = await headReq;
      console.log('Content-Range:', headRes.headers['content-range']);
      console.log('Total rows:', headRes.headers['content-range']?.split('/')[1] || '0');

      // Try to get one row to see columns
      const dataReq = await makeRequest(`${table}?limit=1`);
      if (dataReq.body && Array.isArray(dataReq.body) && dataReq.body.length > 0) {
        console.log('\nColumns (from sample):');
        Object.keys(dataReq.body[0]).forEach(col => {
          const val = dataReq.body[0][col];
          const type = val === null ? 'null' : typeof val;
          console.log(`  - ${col}: ${type}`);
        });
      } else {
        console.log('\nNo data to sample columns from');
      }

      console.log();

    } catch (err) {
      console.log('Error:', err.message);
      console.log();
    }
  }

  console.log('='.repeat(80));
}

inspectSchema().catch(console.error);
