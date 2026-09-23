// generate-data.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const scripCodes = [
  "500325", "532454", "500180", "532174", "500112", "532540", "500034",
  "500510", "543526", "500696", "500209", "524715", "500114", "532500",
  "500520", "512599", "500247", "533096", "532921", "532215", "532281",
  "532538", "500875", "532555", "532977", "541154", "500228", "532978",
  "543320", "500049", "500312", "500790", "511218", "540376", "500188",
  "532898", "500820", "533278", "500440", "500470", "532488", "500300",
  "505200", "541450", "532343", "539448", "530965", "539254", "500420",
  "507685", "544274", "532725", "540719", "517334", "544569", "532868",
  "500331", "543940", "500002", "508869", "500477", "540611", "500490",
  "532134", "500547", "500825", "532483", "500093", "511243", "500087",
  "532541", "500480", "500182", "532187", "500400", "532155", "500425",
  "500103", "532286", "500257", "532424", "500830", "532810", "532955",
  "500469", "532461", "500124", "532777", "533179", "540699", "500387",
  "503806", "532667", "540180", "532648", "500550"
];

const API_URL = 'https://api.bseindia.com/BseIndiaAPI/api/StockReachGraphCas/w';
const dataDirectory = path.join(__dirname, 'data');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
  'Connection': 'keep-alive',
  'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site'
};

// Simple cookie jar
let cookieJar = '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('-');
}

function httpsGet(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        ...HEADERS,
        ...extraHeaders,
        ...(cookieJar ? { Cookie: cookieJar } : {})
      },
      timeout: 30000
    };

    const req = https.request(options, res => {
      // Capture Set-Cookie
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookieJar = setCookie.map(c => c.split(';')[0]).join('; ');
      }

      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function warmUp() {
  console.log('Warming up session (visiting bseindia.com)...');
  try {
    await httpsGet('https://www.bseindia.com/');
    // also hit a stock page once
    await httpsGet('https://www.bseindia.com/stock-share-price/tata-steel-ltd/TATASTEEL/500470/');
    console.log('Warm-up done.\n');
  } catch (e) {
    console.warn('Warm-up failed (continuing anyway):', e.message);
  }
}

async function fetchStockData(scripCode, retries = 2) {
  const url = new URL(API_URL);
  url.searchParams.set('scripcode', scripCode);
  url.searchParams.set('flag', '0');
  url.searchParams.set('fromdate', '');
  url.searchParams.set('todate', '');
  url.searchParams.set('seriesid', '');

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { statusCode, body } = await httpsGet(url.toString());

    if (statusCode >= 200 && statusCode < 300) {
      try {
        return JSON.parse(body);
      } catch {
        throw new Error(`Invalid JSON for ${scripCode}`);
      }
    }

    if (statusCode === 403 && attempt < retries) {
      console.warn(`  403 on ${scripCode} – retrying in 3s...`);
      await sleep(3000);
      // re-warm sometimes helps
      await warmUp();
      continue;
    }

    throw new Error(`HTTP ${statusCode} for scrip code ${scripCode}`);
  }
}

async function generateData() {
  const generatedAt = new Date().toISOString();
  const timestamp = getTimestamp();
  const outputPath = path.join(dataDirectory, `bse-stock-data-${timestamp}.json`);

  const stockData = [];
  const failedScripCodes = [];

  console.log('====================================');
  console.log('Starting BSE data fetch (StockReachGraphCas)');
  console.log('====================================');
  console.log(`Total scrip codes: ${scripCodes.length}`);
  console.log(`Timestamp: ${generatedAt}\n`);

  await warmUp();

  for (const scripCode of scripCodes) {
    console.log(`Fetching scrip code: ${scripCode}`);
    try {
      const data = await fetchStockData(scripCode);
      stockData.push({ scripCode, data });
      console.log(`✅ Successfully fetched: ${scripCode}`);
    } catch (error) {
      console.error(`❌ Failed: ${scripCode} → ${error.message}`);
      failedScripCodes.push({ scripCode, error: error.message });
    }

    // 1.5–2.5 s delay helps avoid rate / bot detection
    await sleep(1500 + Math.random() * 1000);
  }

  const outputData = {
    generatedAt,
    timezone: 'Asia/Kolkata (IST)',
    meta: {
      totalScripCodes: scripCodes.length,
      successful: stockData.length,
      failed: failedScripCodes.length,
      source: 'BSE India API (StockReachGraphCas)'
    },
    stocks: stockData,
    failed: failedScripCodes
  };

  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

  console.log('\n====================================');
  console.log('✅ BSE JSON file generated');
  console.log('====================================');
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Total: ${scripCodes.length}`);
  console.log(`✅ Successful: ${stockData.length}`);
  console.log(`❌ Failed: ${failedScripCodes.length}`);
  console.log(`🕒 Generated at: ${generatedAt}`);
}

generateData().catch(err => {
  console.error('❌ Data generation failed:', err);
  process.exit(1);
});
