

# Fix: PostgREST Schema Cache Nao Recarregou as Politicas RLS

## Diagnostico

As politicas RLS estao **corretas no banco de dados** -- confirmado via query direta:

| Tabela | Politica | Permissiva | Comando |
|--------|----------|------------|---------|
| survey_responses | Insert responses anonymously | SIM | INSERT |
| survey_answers | Insert answers anonymously | SIM | INSERT |
| consent_records | Insert consent anonymously | SIM | INSERT |

O problema e que o **PostgREST** (camada API que processa as requisicoes REST) mantém um cache do schema e das politicas RLS. Mesmo apos a migration ser aplicada, o PostgREST pode nao ter recarregado o cache automaticamente.

## Solucao

Criar uma migration que envia o comando `NOTIFY pgrst, 'reload schema'` para forcar o PostgREST a recarregar todas as politicas RLS do banco de dados.

```sql
-- Forcar PostgREST a recarregar o schema cache
NOTIFY pgrst, 'reload schema';
```

Isso e uma operacao padrao e segura do Supabase/PostgREST.

## Arquivos

Nenhum arquivo de codigo precisa ser alterado. Apenas uma migration SQL com o comando NOTIFY.

## Resultado esperado

Apos a migration, o PostgREST reconhecera as politicas permissivas e as insercoes anonimas funcionarao corretamente.

