

# Resultados dos Testes e Plano de Correção

## Testes Realizados

### 1. Geração de Relatórios — PASSOU
- Login como admin (`marciadorh@testepsico.com.br`)
- Geração de "Laudo Técnico" para campanha "Testes Hoje" — sucesso em ~8s
- Edge Function `generate-report` retornou 200, relatório salvo no storage
- Report card apareceu na lista de relatórios gerados

### 2. Preview de Relatórios — PASSOU
- Clique no botão "Preview" abriu o dialog com iframe
- Relatório renderizado corretamente com capa, identificação, dados da empresa
- Botão "Baixar PDF" presente e funcional

### 3. Acesso Externo (Survey Link) — FALHA PARCIAL
- Link de survey do **mesmo tenant** — PASSOU (tela de consentimento carregou com branding)
- Link de survey de **outro tenant** — FALHOU (mostra "Link inválido")

## Bug Identificado

**Causa raiz**: As políticas de SELECT públicas (`Public read...`) em 5 tabelas estão restritas ao role `anon` apenas. Quando um usuário autenticado de outro tenant abre um link de survey, ele está com role `authenticated`, e a política pública não se aplica.

Tabelas afetadas:
- `survey_invitations` — `Public access to invitations by token` → só `anon`
- `survey_campaigns` — `Public read campaigns via invitation` → só `anon`
- `survey_templates` — `Public read survey templates` → só `anon`
- `survey_dimensions` — `Public read survey dimensions` → só `anon`
- `survey_items` — `Public read survey items` → só `anon`

**Nota**: as políticas de INSERT (`survey_responses`, `survey_answers`, `consent_records`) já estão corretas com `anon, authenticated`.

## Correção Necessária

Uma migração SQL para recriar as 5 políticas de SELECT público adicionando o role `authenticated`:

```sql
-- survey_invitations
DROP POLICY "Public access to invitations by token" ON public.survey_invitations;
CREATE POLICY "Public access to invitations by token" ON public.survey_invitations
  FOR SELECT TO anon, authenticated USING (true);

-- survey_campaigns
DROP POLICY "Public read campaigns via invitation" ON public.survey_campaigns;
CREATE POLICY "Public read campaigns via invitation" ON public.survey_campaigns
  FOR SELECT TO anon, authenticated USING (true);

-- survey_templates
DROP POLICY "Public read survey templates" ON public.survey_templates;
CREATE POLICY "Public read survey templates" ON public.survey_templates
  FOR SELECT TO anon, authenticated USING (true);

-- survey_dimensions
DROP POLICY "Public read survey dimensions" ON public.survey_dimensions;
CREATE POLICY "Public read survey dimensions" ON public.survey_dimensions
  FOR SELECT TO anon, authenticated USING (true);

-- survey_items
DROP POLICY "Public read survey items" ON public.survey_items;
CREATE POLICY "Public read survey items" ON public.survey_items
  FOR SELECT TO anon, authenticated USING (true);
```

Nenhuma alteração de código é necessária — apenas a migração SQL corrige o problema.

## Resumo

| Teste | Resultado |
|---|---|
| Geração de relatório | Passou |
| Preview de relatório | Passou |
| Exportação PDF (botão) | Passou |
| Survey link (mesmo tenant) | Passou |
| Survey link (outro tenant / cross-browser) | Falhou — precisa de fix RLS |

