

# Fix: Relatório Preview Mostrando HTML Raw

## Problema

O iframe usa `src={file_url}` apontando para a URL assinada do storage. O arquivo está sendo servido com content-type incorreto (provavelmente `text/plain` ou `application/octet-stream`), fazendo o navegador exibir o código fonte ao invés de renderizar o HTML.

## Solução

Trocar de `src={url}` para `srcdoc={htmlContent}` no iframe. Isso envolve:

1. Quando o usuário clica para preview, fazer `fetch(file_url)` para obter o conteúdo HTML como string
2. Usar `srcdoc={htmlContent}` no iframe para renderizar o HTML diretamente
3. Adicionar um estado de loading enquanto o fetch acontece

## Arquivo Modificado

`src/pages/Relatorios.tsx`

### Mudanças:
- Novo state: `previewHtml` (string com o conteúdo HTML do relatório)
- Ao abrir preview (`setPreviewReport`), disparar `fetch(file_url)` e salvar o resultado em `previewHtml`
- Trocar `<iframe src={...}>` por `<iframe srcDoc={previewHtml}>`
- Mostrar spinner/loading enquanto o HTML está sendo carregado
- Limpar `previewHtml` ao fechar o dialog

### Também ajustar `handleDownloadPdf`:
- A função já faz fetch do HTML e abre em nova janela — manter essa lógica que já funciona para o print/PDF

