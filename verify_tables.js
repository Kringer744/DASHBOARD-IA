const axios = require('axios');

const BASE_URL = 'https://desk-nocodb.5y4hfw.easypanel.host';
const TOKEN = 'dfx-T6kTspesvooij0wJeYxQ7hBZmDe40RxYZiO8';
const PROJECT_ID = 'pslvd73baqrfuhp';

const TABLE_IDS = {
  empresas: 'moi04r0iuccvhwc',
  unidades: 'mpox9m5jgnks3n3',
  personalidade_ia: 'mvfgubjkqbioo8s',
  faq: 'mcjaj2lozjq4cnt',
  conversas: 'm7s6ctxo8j5pxhh',
  mensagens: 'mayw0d57bbah5sx',
  followups: 'mnhe69176x21wpg',
  templates_followup: 'mauo5wakvxdr8ie',
  eventos_funil: 'm81q133roxtrr9b',
  metricas_diarias: 'm0g5rxsn7jfn5ss',
  logs_erro: 'm8o4j3rsj6bcho6',
  cache_respostas: 'm1kubgrn92qtqss',
  integracoes: 'miz8ntbjw5lxbhs',
  planos: 'mgk8w5o8sgnnv3y',
};

async function verify() {
  const results = {};
  for (const [name, id] of Object.entries(TABLE_IDS)) {
    try {
      await axios.get(`${BASE_URL}/api/v1/db/data/noco/${PROJECT_ID}/${id}`, {
        params: { limit: 1 },
        headers: { 'xc-token': TOKEN }
      });
      results[name] = 'OK';
    } catch (error) {
      results[name] = `FAIL: ${error.response ? error.response.status : error.message}`;
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

verify();
