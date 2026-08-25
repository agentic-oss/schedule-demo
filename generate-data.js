// generate-data.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const scripCodes = [
  "500325", // Reliance Industries
  "532454", // Bharti Airtel
  "500180", // HDFC Bank
  "532174", // ICICI Bank
  "500112", // State Bank of India
  "532540", // TCS
  "500034", // Bajaj Finance
  "500510", // Larsen & Toubro
  "543526", // LIC
  "500696", // Hindustan Unilever
  "500209", // Infosys
  "524715", // Sun Pharma
  "500114", // Titan
  "532500", // Maruti Suzuki
  "500520", // Mahindra & Mahindra
  "512599", // Adani Enterprises
  "500247", // Kotak Mahindra Bank
  "533096", // Adani Power
  "532921", // Adani Ports
  "532215", // Axis Bank
  "532281", // HCL Technologies
  "532538", // UltraTech Cement
  "500875", // ITC
  "532555", // NTPC
  "532977", // Bajaj Auto
  "541154", // Hindustan Aeronautics (HAL)
  "500228", // JSW Steel
  "532978", // Bajaj Finserv
  "543320", // Eternal
  "500049", // Bharat Electronics
  "500312", // ONGC
  "500790", // Nestle India
  "511218", // Shriram Finance
  "540376", // Avenue Supermarts (DMart)
  "500188", // Hindustan Zinc
  "532898", // Power Grid
  "500820", // Asian Paints
  "533278", // Coal India
  "500440", // Hindalco
  "500470", // Tata Steel
  "532488", // Divi's Laboratories
  "500300", // Grasim Industries
  "505200", // Eicher Motors
  "541450", // Adani Green Energy
  "532343", // TVS Motor
  "539448", // InterGlobe Aviation (IndiGo)
  "530965", // Indian Oil Corporation
  "539254", // Adani Energy Solutions
  "500420", // Torrent Pharmaceuticals
  "507685", // Wipro
  "544274", // Hyundai Motor India
  "532725", // Solar Industries
  "540719", // SBI Life Insurance
  "517334", // Samvardhana Motherson
  "544569", // Tata Motors
  "532868", // DLF
  "500331", // Pidilite Industries
  "543940", // Jio Financial Services
  "500002", // ABB India
  "508869", // Apollo Hospitals
  "500477", // Ashok Leyland
  "540611", // AU Small Finance Bank
  "500490", // Bajaj Holdings & Investment
  "532134", // Bank of Baroda
  "500547", // Bharat Petroleum (BPCL)
  "500825", // Britannia Industries
  "532483", // Canara Bank
  "500093", // CG Power
  "511243", // Cholamandalam Investment
  "500087", // Cipla
  "532541", // Coforge
  "500480", // Cummins India
  "500182", // Hero MotoCorp
  "532187", // IndusInd Bank
  "500400", // Tata Power
  "532155", // GAIL
  "500425", // Ambuja Cements
  "500103", // BHEL
  "532286", // Jindal Steel & Power
  "500257", // Lupin
  "532424", // Godrej Consumer
  "500830", // Colgate-Palmolive (India)
  "532810", // Power Finance Corporation
  "532955", // REC
  "500469", // Federal Bank
  "532461", // Punjab National Bank
  "500124", // Dr. Reddy's Laboratories
  "532777", // Info Edge
  "533179", // Persistent Systems
  "540699", // Dixon Technologies
  "500387", // Shree Cement
  "503806", // SRF
  "532667", // Suzlon Energy
  "540180", // Varun Beverages
  "532648", // Yes Bank
  "500550", // Siemens
  "500790", // (Nestle already listed)
  "532215"  // (Axis already listed – example of overlap)
];

const API_URL = 'https://api.bseindia.com/BseIndiaAPI/api/StockReachGraph/w';

const outputPath = path.join(__dirname, 'data', 'bse-stock-data.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchStockData(scripCode) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);

    url.searchParams.set('scripcode', scripCode);
    url.searchParams.set('flag', '0');
    url.searchParams.set('fromdate', '');
    url.searchParams.set('todate', '');
    url.searchParams.set('seriesid', '');

    const request = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.bseindia.com/'
        }
      },
      response => {
        let data = '';

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(
                `HTTP ${response.statusCode} for scrip code ${scripCode}`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(
              new Error(
                `Invalid JSON response for scrip code ${scripCode}`
              )
            );
          }
        });
      }
    );

    request.on('error', error => {
      reject(error);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(
        new Error(`Request timeout for scrip code ${scripCode}`)
      );
    });
  });
}

async function generateData() {
  const generatedAt = new Date().toISOString();

  const stockData = [];
  const failedScripCodes = [];

  console.log(`Starting BSE data fetch...`);
  console.log(`Total scrip codes: ${scripCodes.length}`);

  for (const scripCode of scripCodes) {
    console.log(`Fetching scrip code: ${scripCode}`);

    try {
      const data = await fetchStockData(scripCode);

      stockData.push({
        scripCode,
        data
      });

      console.log(`✅ Successfully fetched: ${scripCode}`);
    } catch (error) {
      console.error(`❌ Failed: ${scripCode}`);
      console.error(`   ${error.message}`);

      failedScripCodes.push({
        scripCode,
        error: error.message
      });
    }

    // Wait 1 second before the next request
    await sleep(1000);
  }

  const outputData = {
    generatedAt,
    timezone: 'Asia/Kolkata (IST)',

    meta: {
      totalScripCodes: scripCodes.length,
      successful: stockData.length,
      failed: failedScripCodes.length,
      source: 'BSE India API'
    },

    stocks: stockData,

    failed: failedScripCodes
  };

  // Ensure data directory exists
  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true
  });

  // Write JSON file
  fs.writeFileSync(
    outputPath,
    JSON.stringify(outputData, null, 2),
    'utf8'
  );

  console.log('');
  console.log('====================================');
  console.log('✅ BSE JSON file generated successfully');
  console.log('====================================');
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Total: ${scripCodes.length}`);
  console.log(`✅ Successful: ${stockData.length}`);
  console.log(`❌ Failed: ${failedScripCodes.length}`);
  console.log(`🕒 Generated at: ${generatedAt}`);
}

generateData().catch(error => {
  console.error('❌ Data generation failed:', error);
  process.exit(1);
});
