import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { email, password, name, phone, role } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Cria usuário de autenticação (sem trocar sessão do admin)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (createErr || !created?.user) {
      return res.status(400).json({ error: createErr?.message || 'Falha ao criar usuário' });
    }

    // Cria perfil na tabela users
    const profile = {
      id: created.user.id,
      email,
      name: name || created.user.user_metadata?.name || '',
      phone: phone || created.user.user_metadata?.phone || null,
      role: role === 'admin' ? 'admin' : 'user',
      plan_type: 'free',
      plan_status: 'inactive',
    } as any;

    const { error: insertErr } = await supabaseAdmin.from('users').insert([profile]);
    if (insertErr) {
      return res.status(400).json({ error: insertErr.message });
    }

    return res.status(200).json({
      id: created.user.id,
      email,
      name: profile.name,
      role: profile.role
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Erro interno' });
  }
}

