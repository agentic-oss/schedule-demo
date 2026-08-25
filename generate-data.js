// generate-data.js
const fs = require('fs');
const path = require('path');

const sampleData = {
  generatedAt: new Date().toISOString(),
  timezone: 'Asia/Kolkata (IST)',
  users: [
    { id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', role: 'admin' },
    { id: 2, name: 'Priya Patel', email: 'priya@example.com', role: 'user' },
    { id: 3, name: 'Rohan Gupta', email: 'rohan@example.com', role: 'user' },
    { id: 4, name: 'Sneha Reddy', email: 'sneha@example.com', role: 'moderator' }
  ],
  products: [
    { id: 101, name: 'Wireless Earbuds', price: 2499, currency: 'INR', inStock: true },
    { id: 102, name: 'Smart Watch', price: 8999, currency: 'INR', inStock: true },
    { id: 103, name: 'Laptop Stand', price: 1299, currency: 'INR', inStock: false }
  ],
  meta: {
    version: '1.0.0',
    source: 'GitHub Actions scheduled job'
  }
};

const outputPath = path.join(__dirname, 'data', 'sample-data.json');

// Ensure the data directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Write the JSON file (pretty-printed)
fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2), 'utf8');

console.log(`✅ JSON file generated successfully at: ${outputPath}`);
console.log(`Generated at: ${sampleData.generatedAt}`);
