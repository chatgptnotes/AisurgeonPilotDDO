const https = require('https');
const fs = require('fs');

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

function getOpenAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'qfneoowktsirwpzehgxp.supabase.co',
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/openapi+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('Fetching OpenAPI specification...\n');
    const spec = await getOpenAPI();

    // Save to file
    fs.writeFileSync('openapi-spec.json', JSON.stringify(spec, null, 2));
    console.log('✓ Saved full spec to openapi-spec.json\n');

    console.log('='.repeat(80));
    console.log('AVAILABLE TABLES (from OpenAPI paths)');
    console.log('='.repeat(80));
    console.log();

    const paths = Object.keys(spec.paths || {});
    const tables = paths
      .filter(p => p !== '/' && !p.includes('rpc/'))
      .map(p => p.replace(/^\//, ''))
      .sort();

    tables.forEach(table => console.log(`  - ${table}`));

    console.log();
    console.log('='.repeat(80));
    console.log('TABLE DEFINITIONS (from OpenAPI definitions)');
    console.log('='.repeat(80));
    console.log();

    const definitions = spec.definitions || {};

    for (const [name, def] of Object.entries(definitions)) {
      console.log('─'.repeat(80));
      console.log(`DEFINITION: ${name}`);
      console.log('─'.repeat(80));

      if (def.properties) {
        console.log('\nColumns:');
        for (const [colName, colDef] of Object.entries(def.properties)) {
          const type = colDef.type || 'unknown';
          const format = colDef.format ? ` (${colDef.format})` : '';
          const nullable = colDef['x-nullable'] !== false ? ' NULL' : ' NOT NULL';
          const defaultVal = colDef.default !== undefined ? ` [default: ${colDef.default}]` : '';
          const desc = colDef.description ? ` // ${colDef.description}` : '';

          console.log(`  - ${colName}: ${type}${format}${nullable}${defaultVal}${desc}`);
        }
      }

      if (def.required && def.required.length > 0) {
        console.log('\nRequired fields:');
        def.required.forEach(field => console.log(`  - ${field}`));
      }

      console.log();
    }

    console.log('='.repeat(80));
    console.log('INSPECTION COMPLETE');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

main();
