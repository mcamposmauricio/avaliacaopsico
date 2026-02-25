

# Ajustar Espacamento entre Labels e Icones do Grafo

## Objetivo
Aumentar a distancia entre os textos (labels) e os circulos dos icones no grafo SVG, pois atualmente estao sobrepostos ou muito proximos.

## Mudanca em `src/pages/Auth.tsx`

Ajustar as coordenadas de texto (`tx`, `ty`) no array `graphNodes` para afastar os labels dos nos:

| No | Label | tx atual | ty atual | tx novo | ty novo | Direcao do afastamento |
|---|---|---|---|---|---|---|
| Estrutura | Building2 | 115 | 55 | 115 | 42 | Mais para cima |
| Colaboradores | Users | 290 | 148 | 310 | 148 | Mais para a direita |
| Campanhas | Send | 250 | 305 | 255 | 320 | Mais para baixo |
| Analises | BarChart3 | 58 | 265 | 48 | 278 | Mais para esquerda e abaixo |

Isso cria ~12-15px adicionais de espaco entre cada label e seu respectivo circulo/icone.

