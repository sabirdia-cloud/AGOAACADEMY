import { createClient } from '@supabase/supabase-client'
const supabase = createClient('REDACTED_URL', 'REDACTED_KEY')
async function check() {
  const { data, error } = await supabase.from('pedagogical_reports').select('*').limit(1)
  if (error) console.log('Table error:', error)
  else console.log('Table exists, columns:', Object.keys(data[0] || {}))
}
check()
