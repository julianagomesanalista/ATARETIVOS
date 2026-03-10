require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testIdeasRLS() {
  // Test with anon key (no session - like Google login user)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data: ideas, error: ie } = await supabase.from('ideas').select('*');
  console.log('IDEAS (anon):', ideas?.length, 'error:', ie?.message || 'none');

  const { data: comments, error: ce } = await supabase.from('idea_comments').select('*');
  console.log('IDEA_COMMENTS (anon):', comments?.length, 'error:', ce?.message || 'none');
  
  const { data: tasks, error: te } = await supabase.from('tasks').select('id, status, creator_id');
  console.log('TASKS (anon):', tasks?.length, 'error:', te?.message || 'none');
  if (tasks) console.log('  sample:', tasks.slice(0, 3).map(t => `${t.status} / creator:${t.creator_id}`));
}

testIdeasRLS();
