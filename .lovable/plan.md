

# Relatórios como PDF com Preview

## Problema

Os relatórios são gerados e armazenados como arquivos `.html` no storage. Ao clicar "Download", o usuário recebe um arquivo HTML exibindo código. O esperado é:
1. **Preview** inline ao clicar no card do relatório
2. **Download como PDF** ao clicar no botão de download

## Solução

### 1. Preview com Dialog + iframe

Adicionar um Dialog (modal) na página `Relatorios.tsx` que exibe o relatório renderizado dentro de um iframe. Ao clicar no card do relatório, abre o preview.

- Usar `<iframe src={file_url}>` para renderizar o HTML formatado
- Dialog fullscreen (max-w-5xl) para boa leitura
- Botão de "Baixar PDF" dentro do Dialog

### 2. Download como PDF via Print do Navegador

Para gerar PDF sem dependências externas:
- Fetch do conteúdo HTML via `file_url`
- Abrir uma janela oculta com o HTML
- Injetar CSS de impressão (`@media print`) e chamar `window.print()`
- O navegador oferece "Salvar como PDF" nativamente

Isso aproveita o CSS de print que já existe no HTML (`page-break-before: always`) e produz PDFs de alta qualidade.

### 3. Melhorias no CSS de Impressão (Edge Function)

Adicionar regras `@media print` no HTML gerado pelo `generate-report` para garantir boa formatação no PDF:
- Ocultar margens extras
- Garantir quebras de página corretas
- Ajustar cores para impressão

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Relatorios.tsx` | Adicionar Dialog de preview com iframe + botão PDF via print |
| `supabase/functions/generate-report/index.ts` | Adicionar `@media print` styles no HTML gerado |

## Detalhes Técnicos

### Relatorios.tsx

- Novo state: `previewReport` (relatório selecionado para preview)
- Dialog com iframe usando `src={report.file_url}`
- Botão "Baixar PDF" que:
  1. Faz `fetch(file_url)` para obter o HTML
  2. Abre `window.open()` com o HTML
  3. Injeta script que chama `window.print()` automaticamente
  4. O navegador exibe o diálogo de impressão com opção "Salvar como PDF"
- Cards dos relatórios agora são clicáveis (cursor-pointer) para abrir preview
- Botão "Download" muda label para "Baixar PDF"

### generate-report/index.ts

Adicionar no bloco `<style>` do HTML gerado:

```css
@media print {
  body { padding: 20px; }
  .page-break { page-break-before: always; }
  .igp-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .alert-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .methodology { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .disclaimer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

Isso garante que cores de fundo, badges e caixas coloridas sejam preservadas no PDF.
