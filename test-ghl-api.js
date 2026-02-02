
const fs = require('fs');
const path = require('path');

async function testGhl() {
  // Manually parse .env
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim();
    }
  });

  const locationId = env.LOCATION_ID || 'aNFhVjVb4aVsZFFZypZB';
  const accessToken = env.GHL_ACCESS_TOKEN;
  const email = 'schmidfamily5@gmail.com';

  console.log('Testing GHL API with:');
  console.log('Location ID:', locationId);
  console.log('Access Token:', accessToken ? 'Present' : 'Missing');
  console.log('Email:', email);

  if (!accessToken) {
    console.error('Error: GHL_ACCESS_TOKEN is missing in .env');
    return;
  }

  try {
    const response = await fetch("https://services.leadconnectorhq.com/contacts/search", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        locationId: locationId,
        pageLimit: 20,
        filters: [
          {
            field: "email",
            operator: "eq",
            value: email
          }
        ]
      })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

testGhl();
