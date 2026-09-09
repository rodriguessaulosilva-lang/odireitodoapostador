# Como aplicar a identidade visual do Rodrigues e Dantas

Toda a marca fica em **um único arquivo**: `assets/identidade.css`.
Nunca edite `dossie.css` (é só o layout).

## 1. Logo
- Coloque o arquivo do logo oficial na pasta `assets/`
  (ex.: `assets/logo-rodrigues-dantas.png` — PNG com fundo transparente ou
  SVG, boa resolução).
- Em `identidade.css`, ajuste:
  ```css
  --logo: url("logo-rodrigues-dantas.png");
  ```
- O arquivo atual `logo-placeholder.svg` é só provisório (monograma "RD").
- **PNG é o mais seguro.** Se usar SVG, evite dois hifens seguidos (`--`)
  dentro de comentários `<!-- ... -->` do arquivo: isso é XML inválido e faz
  o logo não renderizar no PDF.

## 2. Cores
Substitua os valores `--cor-*` pelos códigos hex oficiais. Principais:
- `--cor-primaria`: cor dominante (capa, títulos, cabeçalho).
- `--cor-secundaria`: cor de destaque (filetes, detalhes dourados).
- `--cor-fundo-capa`: fundo da capa (costuma ser igual à primária).

Se você tiver o logo mas não souber os hex, me mande o logo que eu extraio as
cores dele.

## 3. Tipografia
- `--fonte-titulo`: fonte dos títulos (serifada, sóbria).
- `--fonte-corpo`: fonte do texto corrido.
- Para usar uma fonte específica da marca que não está instalada, me avise:
  é preciso embutir o arquivo da fonte (.ttf/.woff) — eu configuro o
  `@font-face`.

## 4. Dados do timbre (rodapé de cada página)
Preencha:
```css
--escritorio-nome: "Rodrigues e Dantas Advocacia";
--escritorio-linha2: "OAB/__ nº ____  •  e-mail  •  telefone";
--escritorio-endereco: "Endereço — Cidade/UF";
```

## Dica
Depois de trocar logo e cores, gere um dossiê de teste com 2–3 documentos para
conferir o visual antes de usar num caso real.
