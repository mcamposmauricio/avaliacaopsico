

# Plano: Atualizar emails para teste + seleção de destinatários

## 1. Atualizar emails de 4 colaboradores para teste

A campanha "Avaliação Semestral 2026" tem convites pendentes para colaboradores com emails fictícios (`@testepsico.exemplo.br`). Vou criar uma migration para atualizar os emails de 4 desses colaboradores:

| Colaborador | Email atual | Novo email |
|---|---|---|
| Fábio Vieira | fabio.vieira@testepsico.exemplo.br | mcampos.mauricio@gmail.com |
| Giovana Nunes | giovana.nunes@testepsico.exemplo.br | mauriciotadeu_campos@hotmail.com |
| Hugo Campos | hugo.campos@testepsico.exemplo.br | camposmauricio_o.o@hotmail.com |
| Ingrid Castro | ingrid.castro@testepsico.exemplo.br | mauricio@marqponto.com.br |

## 2. Atualizar dialog de envio de email com opção de seleção

Modificar o dialog "Enviar por Email" em `src/pages/Campanhas.tsx` para:

- Adicionar duas opções: **"Enviar para todos pendentes"** e **"Selecionar funcionários"**
- No modo seleção, listar os colaboradores com convites pendentes (nome + email) com checkboxes
- Passar os `invitation_ids` selecionados para a Edge Function
- Atualizar `send-survey-emails/index.ts` para aceitar um parâmetro opcional `invitation_ids` que filtra apenas os convites selecionados

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | Atualizar 4 emails de colaboradores |
| `src/pages/Campanhas.tsx` | Novo dialog com seleção de destinatários |
| `supabase/functions/send-survey-emails/index.ts` | Aceitar filtro `invitation_ids` opcional |

