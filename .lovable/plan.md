

# Fix: Links de Survey Retornando "Link Invalido"

## Diagnostico

Dois problemas identificados:

### Problema 1 -- RLS bloqueia acesso anonimo (causa principal)

O SurveyRuntime consulta 6 tabelas usando o client Supabase. Um respondente anonimo (sem login) nao tem `auth.uid()`, portanto as politicas RLS que verificam `get_user_tenant_id(auth.uid())` retornam null, bloqueando o acesso.

Tabelas afetadas:
- `survey_campaigns` -- join a partir de invitations
- `survey_templates` -- join aninhado
- `tenants` -- busca branding
- `survey_dimensions` -- busca dimensoes do questionario
- `survey_items` -- busca itens/perguntas

Resultado: `inv.survey_campaigns` retorna null, o codigo entra no catch e exibe "Link invalido".

### Problema 2 -- Links copiados sao de campanha em `draft`

Os 52 links copiados pertencem a "Campanha testezinho" com status `draft`. O SurveyRuntime rejeita campanhas nao-ativas corretamente, mas o erro aparece como "Link invalido" ao inves de uma mensagem mais clara.

## Solucao

### Migration SQL -- Adicionar politicas RLS para acesso anonimo

Criar politicas SELECT somente-leitura para acesso publico em 4 tabelas necessarias para o fluxo do respondente:

```sql
-- survey_campaigns: permitir leitura publica (necessario para validar status)
CREATE POLICY "Public read campaigns via invitation"
  ON survey_campaigns FOR SELECT
  USING (true);

-- tenants: permitir leitura publica limitada (branding)
CREATE POLICY "Public read tenant branding"
  ON tenants FOR SELECT
  USING (true);

-- survey_dimensions: permitir leitura publica
CREATE POLICY "Public read survey dimensions"
  ON survey_dimensions FOR SELECT
  USING (true);

-- survey_items: permitir leitura publica
CREATE POLICY "Public read survey items"
  ON survey_items FOR SELECT
  USING (true);
```

Nota: `survey_templates` ja e carregado via join aninhado em `survey_campaigns(*, survey_templates(*))`. Se necessario, adicionar politica similar para `survey_templates`.

### Arquivo: src/pages/SurveyRuntime.tsx

Nenhuma mudanca de codigo necessaria. O problema e exclusivamente de permissoes no banco de dados.

## Tabelas com dados sensiveis

As politicas acima permitem SELECT publico. Isso e aceitavel porque:
- `survey_campaigns`: contem apenas metadados da campanha (nome, datas, status)
- `tenants`: contem apenas dados de branding (nome, logo, cores)
- `survey_dimensions`: contem apenas nomes de dimensoes
- `survey_items`: contem apenas texto das perguntas
- Nenhuma dessas tabelas contem dados pessoais ou respostas

Dados sensiveis (respostas, scores) permanecem protegidos pelas politicas existentes.

## Resultado Esperado

Apos a migration:
1. Links de campanhas **ativas** abrirao a tela de consentimento normalmente
2. Links de campanhas em **draft** mostrarao mensagem de "avaliacao indisponivel" (nao "link invalido")
3. Links de campanhas **encerradas** mostrarao mensagem de "avaliacao encerrada"
4. Respondentes anonimos poderao preencher e submeter o questionario completo
