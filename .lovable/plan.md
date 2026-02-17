

# Fix: RLS Bloqueando Submissao Anonima de Respostas

## Diagnostico

Erro: `new row violates row-level security policy for table "survey_responses"`

As 3 tabelas de escrita anonima possuem politicas INSERT criadas como **RESTRICTIVE** ao inves de **PERMISSIVE**:

| Tabela | Politica | Tipo atual | Problema |
|--------|----------|------------|----------|
| `survey_responses` | "Insert responses anonymously" | RESTRICTIVE | Sem politica permissiva, INSERT e negado |
| `survey_answers` | "Insert answers anonymously" | RESTRICTIVE | Mesmo problema |
| `consent_records` | "Insert consent anonymously" | RESTRICTIVE | Mesmo problema |

No PostgreSQL RLS: se existem apenas politicas restritivas e nenhuma permissiva, o acesso e **sempre negado**. Politicas restritivas servem para adicionar restricoes extras sobre politicas permissivas existentes.

## Solucao

Recriar as 3 politicas como **PERMISSIVE**:

```sql
-- survey_responses
DROP POLICY "Insert responses anonymously" ON survey_responses;
CREATE POLICY "Insert responses anonymously"
  ON survey_responses FOR INSERT
  WITH CHECK (true);

-- survey_answers
DROP POLICY "Insert answers anonymously" ON survey_answers;
CREATE POLICY "Insert answers anonymously"
  ON survey_answers FOR INSERT
  WITH CHECK (true);

-- consent_records
DROP POLICY "Insert consent anonymously" ON consent_records;
CREATE POLICY "Insert consent anonymously"
  ON consent_records FOR INSERT
  WITH CHECK (true);
```

Por padrao, `CREATE POLICY` cria politicas **PERMISSIVE**, que e o comportamento correto para permitir insercoes anonimas.

## Arquivos

Nenhum arquivo de codigo precisa ser alterado. A correcao e exclusivamente no banco de dados via migration SQL.

## Resultado esperado

Apos a migration, respondentes anonimos poderao submeter o questionario completo sem erros de RLS.
