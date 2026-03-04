import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Rota de "keep-alive" para evitar que o banco de dados durma.
// Chamada pelo cron-job.org a cada 24 horas.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Query leve: busca apenas 1 registro para "acordar" o banco
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[PING] Erro ao conectar ao banco:', error.message);
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString();
    console.log(`[PING] Banco acordado com sucesso em ${timestamp}`);

    return NextResponse.json({
      status: 'ok',
      message: 'Banco de dados respondendo normalmente.',
      timestamp,
    });
  } catch (err) {
    console.error('[PING] Erro inesperado:', err);
    return NextResponse.json(
      { status: 'error', message: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
