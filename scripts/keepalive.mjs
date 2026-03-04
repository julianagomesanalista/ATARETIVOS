// Script de Keep-Alive local para o Supabase
// Rode com: node scripts/keepalive.mjs
// Mantém o banco ativo enquanto o app não está em produção.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dprbgbapupmklowrvsur.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qyD4ZtN8toS5GQCdS4VPKQ_GWwKJ-dO';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ping() {
  const { error } = await supabase.from('users').select('id').limit(1);
  const timestamp = new Date().toLocaleString('pt-BR');

  if (error) {
    console.error(`[${timestamp}] ❌ Erro:`, error.message);
  } else {
    console.log(`[${timestamp}] ✅ Banco acordado com sucesso!`);
  }
}

// Executa uma vez agora
ping();

// Depois repete a cada 12 horas
const DOZE_HORAS = 12 * 60 * 60 * 1000;
setInterval(ping, DOZE_HORAS);
console.log('🔁 Keep-alive ativo. Ping a cada 12h. (Ctrl+C para parar)');
