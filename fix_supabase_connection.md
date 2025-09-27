# 🔧 CORREÇÃO DOS PROBLEMAS DE CONEXÃO COM SUPABASE

## **Problema Identificado:**
A aplicação está tentando conectar com um Supabase local (`127.0.0.1:54321`) que não está rodando, causando erros `net::ERR_CONNECTION_REFUSED`.

## **Soluções Possíveis:**

### **Opção 1: Usar Supabase em Produção (Recomendado)**

1. **Crie um arquivo `.env` na raiz do projeto:**
```bash
# Configurações do Supabase
VITE_SUPABASE_URL=https://edvdzfvevldfetveupes.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdmR6ZnZldmxkZmV0dmV1cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ0MDAsImV4cCI6MjA1MjU1MDQwMH0.ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

2. **Reinicie o servidor de desenvolvimento:**
```bash
npm run dev
```

### **Opção 2: Usar Supabase Local**

1. **Instale o Supabase CLI:**
```bash
npm install -g supabase
```

2. **Inicie o Supabase local:**
```bash
supabase start
```

3. **Execute as migrações:**
```bash
supabase db reset
```

### **Opção 3: Configurar Variáveis de Ambiente**

1. **Crie o arquivo `.env` manualmente:**
```env
VITE_SUPABASE_URL=https://edvdzfvevldfetveupes.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdmR6ZnZldmxkZmV0dmV1cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ0MDAsImV4cCI6MjA1MjU1MDQwMH0.ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

2. **Reinicie o servidor:**
```bash
npm run dev
```

## **Verificação:**

Após aplicar a solução, verifique se:
- ✅ Os erros `net::ERR_CONNECTION_REFUSED` desapareceram
- ✅ Os dados carregam corretamente na aplicação
- ✅ Não há mais erros 400 no console
- ✅ As seções "Anúncios em Destaque" e "Anúncios Recentes" mostram dados

## **Próximos Passos:**

1. Execute os scripts SQL que criamos anteriormente no Supabase
2. Teste a aplicação para garantir que tudo funciona
3. Configure as variáveis de ambiente corretas

## **Comandos Úteis:**

```bash
# Verificar se o Supabase local está rodando
supabase status

# Parar o Supabase local
supabase stop

# Iniciar o Supabase local
supabase start

# Ver logs do Supabase
supabase logs
```
