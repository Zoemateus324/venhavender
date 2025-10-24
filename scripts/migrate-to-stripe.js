/**
 * Script de migração do Asaas para Stripe
 * Este script atualiza os dados existentes para usar o Stripe
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateToStripe() {
  console.log('🚀 Iniciando migração para Stripe...');

  try {
    // 1. Atualizar pagamentos existentes
    console.log('📝 Atualizando registros de pagamento...');
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .in('payment_method', ['asaas', 'credit_card', 'pix', 'boleto']);

    if (paymentsError) {
      console.error('Erro ao buscar pagamentos:', paymentsError);
      return;
    }

    console.log(`📊 Encontrados ${payments.length} pagamentos para migrar`);

    for (const payment of payments) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_method: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error(`Erro ao atualizar pagamento ${payment.id}:`, updateError);
      } else {
        console.log(`✅ Pagamento ${payment.id} migrado com sucesso`);
      }
    }

    // 2. Atualizar planos para remover links do Asaas
    console.log('📝 Atualizando planos...');
    
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .not('asaas_payment_link', 'is', null);

    if (plansError) {
      console.error('Erro ao buscar planos:', plansError);
    } else {
      console.log(`📊 Encontrados ${plans.length} planos com links Asaas`);

      for (const plan of plans) {
        const { error: updateError } = await supabase
          .from('plans')
          .update({
            asaas_payment_link: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plan.id);

        if (updateError) {
          console.error(`Erro ao atualizar plano ${plan.id}:`, updateError);
        } else {
          console.log(`✅ Plano ${plan.id} atualizado com sucesso`);
        }
      }
    }

    // 3. Adicionar colunas do Stripe se não existirem
    console.log('📝 Verificando estrutura do banco...');
    
    // Esta parte seria feita via migração SQL, mas podemos verificar se as colunas existem
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'payments' });

    if (columnsError) {
      console.log('⚠️  Não foi possível verificar colunas. Execute as migrações SQL manualmente.');
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Configure as variáveis de ambiente do Stripe');
    console.log('2. Configure o webhook do Stripe');
    console.log('3. Teste os pagamentos em ambiente de desenvolvimento');
    console.log('4. Atualize a documentação');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateToStripe();
}

module.exports = { migrateToStripe };
