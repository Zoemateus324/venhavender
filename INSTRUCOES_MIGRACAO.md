# Instruções para Aplicar a Migração do Campo ad_type

## Problema
O campo `ad_type` não existe no banco de dados, causando erros 400 nas queries do Supabase.

## Solução
Execute o script SQL `apply_ad_type_migration.sql` no banco de dados.

## Como Aplicar

### Opção 1: Via Supabase Dashboard
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em "SQL Editor"
4. Cole o conteúdo do arquivo `apply_ad_type_migration.sql`
5. Execute o script

### Opção 2: Via psql (se tiver acesso direto)
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f apply_ad_type_migration.sql
```

### Opção 3: Via Supabase CLI (quando configurado)
```bash
npx supabase db push
```

## Após Aplicar a Migração

1. **Reative o filtro no AdGrid.tsx:**
   - Descomente a linha: `query = query.eq('ad_type', selectedAdType);`
   - Remova o console.log

2. **Reative o campo no CreateAdModal.tsx:**
   - Descomente a linha: `ad_type: formData.ad_type,`

3. **Teste a funcionalidade:**
   - Crie um novo anúncio selecionando "Venda" ou "Locação"
   - Use os filtros na página inicial
   - Verifique se os badges aparecem corretamente

## Verificação
Após aplicar a migração, execute esta query para verificar:
```sql
SELECT COUNT(*) as total_ads, 
       COUNT(CASE WHEN ad_type = 'sale' THEN 1 END) as sale_ads,
       COUNT(CASE WHEN ad_type = 'rent' THEN 1 END) as rent_ads
FROM ads;
```

## Status Atual
- ✅ Interface implementada
- ✅ Filtros funcionais (temporariamente desabilitados)
- ✅ Badges visuais implementados
- ⏳ Migração do banco pendente
- ⏳ Ativação completa pendente
