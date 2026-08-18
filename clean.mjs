import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clean() {
  console.log('Fetching categories...');
  const { data: cats, error } = await supabase.from('categorias_gasto').select('id, nombre, familia_id, user_id');
  if (error) { console.error('Error:', error); return; }
  
  console.log('Found categories:', cats.length);
  if (cats.length > 0) {
    console.log('Examples:', cats.slice(0, 5));
    const { error: delErr } = await supabase.from('categorias_gasto').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) console.error('Delete error:', delErr);
    else console.log('Successfully deleted all categories!');
  }
}
clean();
