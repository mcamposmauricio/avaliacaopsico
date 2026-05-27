## Objetivo

Tornar o template de questionário do tenant da Marcia (`FPI — Fatores Psicossociais Integrados v1.0`, id `451dc1db-7cd6-424a-b818-90e5062d6faf`, tenant "Flew testes") o template **padrão global**, visível e selecionável em **todos os tenants** (atuais e futuros), sem precisar duplicar o template a cada novo tenant.

## Estratégia

Em vez de clonar o template para cada tenant (que gera divergência ao longo do tempo), marcar o template da Marcia como **global** e ajustar a query do dropdown para incluir templates globais além dos do próprio tenant.

## Mudanças

### 1. Migração de schema (`survey_templates`)
Adicionar coluna `is_global boolean NOT NULL DEFAULT false`.

### 2. Migração de dados
- Marcar o template `451dc1db-...` (tenant Flew testes / Marcia) como `is_global = true`.
- Marcar o outro `FPI — Fatores Psicossociais Integrados v1.0` (id `9bcb4adf-...`, tenant `1a86e65c-...`) como `is_active = false`, já que será substituído pela versão global e tem a mesma estrutura. Campanhas já existentes que apontam para esse template continuam funcionando — `is_active=false` só esconde do dropdown.

### 3. Frontend (`src/pages/Campanhas.tsx`, linha 74)
Atualizar a query para incluir o template global:

```ts
const { data, error } = await supabase
  .from("survey_templates")
  .select("id, name")
  .eq("is_active", true)
  .or(`tenant_id.eq.${tenantId},is_global.eq.true`);
```

## Resultado

- Todo tenant existente vê **1 opção** no dropdown: o FPI global da Marcia.
- Todo tenant futuro automaticamente herda esse template (sem seed/clone).
- Edições futuras no template propagam para todos os tenants instantaneamente — fonte única de verdade.
- Histórico de campanhas antigas continua intacto.

## Observações técnicas

- A RLS atual de `survey_templates` já tem policy "Public read survey templates" para `anon,authenticated`, então usuários de outros tenants conseguem ler o template global sem mudança de policy.
- `survey_dimensions` e `survey_items` também têm policies de leitura pública, então o runtime do questionário continua funcionando para todos os tenants.
- Edge functions que rodam com service role (ex.: `seed-test-data`) não são afetadas.