

# Adicionar Titulos aos Nos do Grafo SVG

## Objetivo
Posicionar labels de texto ao lado de cada no (icone) do grafo SVG no painel esquerdo, identificando cada etapa do fluxo.

## Mudancas

### `src/pages/Auth.tsx`

Adicionar um campo `label` ao array `graphNodes` e renderizar `<text>` SVG posicionado proximo a cada no:

| No | Icone | Label | Posicao do texto |
|---|---|---|---|
| 1 | Building2 (140, 80) | Estrutura | Acima-esquerda do no |
| 2 | Users (260, 140) | Colaboradores | A direita do no |
| 3 | Send (220, 280) | Campanhas | Abaixo-direita do no |
| 4 | BarChart3 (100, 240) | Analises | A esquerda do no |

Cada label sera um elemento `<text>` SVG com:
- Fonte pequena (`font-size="11"`)
- Cor `sidebar-foreground` com opacidade reduzida (~0.6)
- `font-weight="500"`
- Posicionamento com offset de ~8-12px do circulo do no, na direcao oposta ao centro (180,180) para evitar sobreposicao com as linhas

Os labels terao a mesma animacao `animate-node-pulse` do no pai, aparecendo junto com o icone.

### Detalhes tecnicos

Apenas o arquivo `src/pages/Auth.tsx` sera modificado:
- Adicionar `label` e coordenadas de texto (`tx`, `ty`) ao array `graphNodes`
- Dentro do `<g>` de cada no, adicionar `<text>` SVG com o label

