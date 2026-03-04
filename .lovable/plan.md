

# Plano de Correções e Melhorias — 7 Itens

## 1. Correção da geração de relatórios

**Causa raiz**: A Edge Function `generate-report` usa `anonClient.auth.getClaims(token)` (linha 37), que **nao existe** na API do Supabase JS. Isso causa um erro silencioso que retorna 401/400.

**Correção**: Substituir `getClaims` por `anonClient.auth.getUser(token)` para extrair o `userId`. Tambem melhorar o tratamento de erro na interface (`Relatorios.tsx`) para exibir mensagens amigaveis.

**Arquivos**: `supabase/functions/generate-report/index.ts`, `src/pages/Relatorios.tsx`

---

## 2. Correção RLS para envio de avaliação cross-browser

**Causa raiz**: As politicas de INSERT nas tabelas `survey_responses`, `survey_answers` e `consent_records` estao marcadas como RESTRICTIVE (`Permissive: No`). Politicas restritivas so funcionam se houver pelo menos uma politica PERMISSIVE para a mesma operacao. Dependendo do estado de sessao do navegador, o papel pode variar entre `anon` e `authenticated`, causando falhas inconsistentes.

**Correção**: Recriar as 3 politicas de INSERT como PERMISSIVE e com `TO anon, authenticated`:
- `consent_records`: INSERT WITH CHECK (true)
- `survey_responses`: INSERT WITH CHECK (true)
- `survey_answers`: INSERT WITH CHECK (true)

**Migracao SQL**: DROP + CREATE POLICY para cada uma.

---

## 3. Salvar IP do respondente

**Correção**:
- Adicionar colunas `ip_address TEXT` e `user_agent TEXT` na tabela `consent_records` (via migracao)
- Criar uma Edge Function `capture-consent` que recebe os dados de consentimento e salva junto com IP (extraido de `req.headers.get("x-forwarded-for")`) e user-agent
- Atualizar `SurveyRuntime.tsx` para chamar a edge function em vez de inserir diretamente

**Arquivos**: Nova edge function `supabase/functions/capture-consent/index.ts`, `src/pages/SurveyRuntime.tsx`, migracao SQL

---

## 4. Regras de negocio no modulo de Acoes

### 4.1 Campos obrigatorios
Tornar obrigatorios: titulo, responsavel, prazo. Desabilitar botao "Criar" se faltarem.

### 4.2 Editar e excluir
Adicionar botoes de editar (dialog com campos preenchidos) e excluir (AlertDialog de confirmacao) em cada card de acao.

### 4.3 Regra de conclusao
Impedir transicao direta de `pending` para `completed`. So permitir `completed` se `status === "in_progress"`. Remover o botao "Concluir" quando status for `pending`.

**Arquivo**: `src/pages/PlanoAcao.tsx`

---

## 5. Ajustes na estrutura de dados

### 5.1 Exclusao de registros em uso
Antes de excluir unidade/departamento/cargo, verificar se ha colaboradores vinculados. Se houver, mostrar toast de erro impedindo a exclusao.

### 5.2 CSV duplicando dados
A exportacao CSV em Campanhas.tsx (linha 224-246) faz query de `survey_invitations` com join em `employees`. Revisar query — se um employee tem multiplos convites para a mesma campanha, a query ja filtra por `campaign_id`, entao nao deveria duplicar. O problema pode estar na exportacao de colaboradores em `Colaboradores.tsx`. Adicionar `SELECT DISTINCT` ou dedup no JS.

### 5.3 Prevenir cadastros duplicados
Adicionar UNIQUE constraints via migracao:
- `org_units(tenant_id, name)`
- `departments(tenant_id, name, org_unit_id)`
- `job_roles(tenant_id, name)`

Adicionar validacao no frontend antes de criar (verificar se ja existe com mesmo nome).

**Arquivos**: `src/pages/Estrutura.tsx`, `src/pages/Colaboradores.tsx`, migracao SQL

---

## 6. Texto do envio de convites

**Arquivo**: `src/pages/Campanhas.tsx` (linha 430)

Alterar de:
> "Serao enviados emails para X colaboradores com convites pendentes da campanha..."

Para:
> "Serao enviados e-mails para X colaboradores que ainda nao responderam a campanha '...'. Deseja continuar?"

---

## 7. Identidade visual — Paleta da marca

Atualizar `src/index.css` com os novos design tokens:

| Token | Valor HSL (de hex) |
|---|---|
| `--primary` | 222 100% 56% (#1F5EFF) |
| `--primary-foreground` | 0 0% 100% |
| `--foreground` | 214 73% 15% (#0B1C3F) |
| `--background` | 216 33% 96% (#F2F4F7) |
| `--accent` | 196 100% 65% (#4FD1FF) |
| `--sidebar-background` | 214 73% 15% (#0B1C3F) |
| `--sidebar-primary` | 196 100% 65% (#4FD1FF) |

Atualizar tambem os tokens `dark` mode, `--ring`, `--secondary`, e derivados para manter consistencia. A paleta sera aplicada automaticamente em botoes, links, cards, graficos, barras de progresso e estados hover/focus via design tokens CSS.

**Arquivo**: `src/index.css`

---

## Resumo de arquivos

| # | Arquivo | Tipo |
|---|---|---|
| 1 | `supabase/functions/generate-report/index.ts` | Editar (getClaims → getUser) |
| 1 | `src/pages/Relatorios.tsx` | Editar (mensagem de erro) |
| 2 | Migracao SQL | Recriar policies INSERT como PERMISSIVE |
| 3 | Migracao SQL | Adicionar ip_address, user_agent em consent_records |
| 3 | `supabase/functions/capture-consent/index.ts` | Criar |
| 3 | `src/pages/SurveyRuntime.tsx` | Editar (usar edge function para consent) |
| 4 | `src/pages/PlanoAcao.tsx` | Editar (campos obrigatorios, editar/excluir, regra de status) |
| 5 | `src/pages/Estrutura.tsx` | Editar (validar uso antes de excluir, dedup) |
| 5 | Migracao SQL | UNIQUE constraints |
| 6 | `src/pages/Campanhas.tsx` | Editar (texto email) |
| 7 | `src/index.css` | Editar (paleta) |

## Ordem de execucao

1. Migracao SQL (RLS + colunas + constraints) — tudo em uma migracao
2. Edge function `capture-consent`
3. Correcoes de codigo (todos os arquivos em paralelo)
4. Paleta visual por ultimo (impacto global)

