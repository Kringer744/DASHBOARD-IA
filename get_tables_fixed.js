const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'https://desk-nocodb.5y4hfw.easypanel.host';
const TOKEN = 'dfx-T6kTspesvooij0wJeYxQ7hBZmDe40RxYZiO8';
const PROJECT_ID = 'pslvd73baqrfuhp';

async function getTables() {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/db/meta/projects/${PROJECT_ID}/tables`, {
      headers: { 'xc-token': TOKEN }
    });
    const mapping = {};
    response.data.list.forEach(table => {
      mapping[table.title] = table.id;
    });
    fs.writeFileSync('tables_fixed.json', JSON.stringify(mapping, null, 2), 'utf8');
    console.log('Done');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTables();
