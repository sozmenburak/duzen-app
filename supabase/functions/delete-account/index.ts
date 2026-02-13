// Kullanıcının kendi hesabını silmesi. JWT ile sadece kendi uid'si silinebilir.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Yetkisiz' }, { status: 401, headers: corsHeaders() })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token)
    if (userError || !user?.id) {
      return Response.json({ error: 'Geçersiz oturum' }, { status: 401, headers: corsHeaders() })
    }

    const uid = user.id
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Önce sadece bu kullanıcının user_data satırını sil (RLS mantığı: sadece kendi verisi)
    const { error: dataError } = await supabaseAdmin.from('user_data').delete().eq('user_id', uid)
    if (dataError) {
      console.error('user_data delete error:', dataError)
      return Response.json({ error: dataError.message }, { status: 500, headers: corsHeaders() })
    }

    // Sonra auth hesabını sil
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid)
    if (deleteError) {
      console.error('deleteUser error:', deleteError)
      return Response.json({ error: deleteError.message }, { status: 500, headers: corsHeaders() })
    }

    return Response.json({ ok: true }, { status: 200, headers: corsHeaders() })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Beklenmeyen hata' }, { status: 500, headers: corsHeaders() })
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
