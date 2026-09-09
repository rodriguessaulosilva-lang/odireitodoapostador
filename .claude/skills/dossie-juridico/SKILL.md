---
name: dossie-juridico
description: >-
  Gera um dossiê jurídico profissional em PDF a partir dos documentos de um
  cliente do Rodrigues e Dantas Advocacia. Lê todos os arquivos de uma pasta
  do cliente, classifica cada documento por tipo, monta um sumário navegável e
  produz um dossiê único com a identidade visual do escritório (capa com logo,
  cores, cabeçalho e rodapé timbrados). Use quando o usuário pedir para "montar
  um dossiê", "organizar os documentos do cliente", "gerar o dossiê do caso"
  ou mencionar preparar/consolidar documentos de um cliente para família,
  imobiliário, consumidor ou cível.
---

# Dossiê Jurídico — Rodrigues e Dantas Advocacia

Monta um dossiê consolidado em PDF a partir da pasta de documentos de um
cliente: classifica cada arquivo por tipo, escreve uma ficha para cada um,
gera um sumário com números de página e aplica a identidade visual do
escritório (capa, timbre, cabeçalho/rodapé). Organização padrão: **por tipo
de documento**. Saída padrão: **PDF**.

## Quando usar

- "Monte o dossiê do cliente Fulano"
- "Organiza esses documentos do divórcio da cliente X"
- "Gera o dossiê da partilha / da guarda / do distrato"
- Qualquer pedido para consolidar/organizar documentos de um cliente num único
  documento apresentável.

## Entrada esperada

Uma **pasta por cliente**, ex.:

```
Cliente_Maria_Silva/
├── rg_maria.pdf
├── cpf_maria.jpg
├── certidao_casamento.pdf
├── comprovante_residencia.pdf
├── matricula_imovel.pdf
├── contrato_compra_venda.pdf
├── prints_whatsapp.pdf
└── procuracao.pdf
```

Antes de gerar, confirme com o usuário (se não estiver claro):
1. **Nome do cliente** e, se houver, **nº do processo** e **vara/comarca**.
2. **Tipo de caso**: Família (divórcio, união estável, guarda, alimentos,
   partilha), Imobiliário (compra e venda, locação, distrato, regularização),
   Consumidor, ou Cível. Isso define a ordem das seções — veja
   `references/taxonomia.md`.
3. Se deve **anexar os documentos originais na íntegra** ao final (recomendado)
   ou apenas fichar/resumir cada um.

Não invente dados (partes, datas, valores, nº de processo). Se um dado não
estiver nos documentos, marque como "não localizado" e siga em frente.

## Passo a passo

### 1. Leia e classifique cada arquivo
Para cada arquivo da pasta:
- Extraia o texto. Para **PDF**, use a skill `pdf` (extração de texto/tabelas;
  faça OCR se for digitalizado). Para **imagens** (RG, comprovantes, prints),
  leia o conteúdo visualmente com a ferramenta Read.
- Classifique pelo **tipo de documento** usando a taxonomia em
  `references/taxonomia.md` (Identificação, Comprovantes, Contratos/Títulos,
  Provas e Comunicações, Peças Processuais, Procuração/Honorários, Outros).
- Registre para cada documento: título, tipo, data relevante, partes/valores
  citados e um resumo de 1–3 linhas.

### 2. Monte o resumo do caso
Escreva uma síntese objetiva (5–12 linhas): quem são as partes, o objeto do
caso, o estágio (extrajudicial/judicial) e os pontos de atenção. Vai na capa
e/ou na primeira seção. Tom técnico-jurídico, sóbrio, sem adjetivação.

### 3. Gere o HTML do dossiê
Copie o modelo `references/modelo-dossie.html` para a pasta de trabalho do caso
e preencha:
- **Capa**: nome do cliente, tipo de caso, nº do processo, data, e o resumo.
- **Sumário**: um item por seção e por documento (a numeração de página é
  automática — não digite números).
- **Seções por tipo**: para cada documento, uma **ficha** (título, tipo, data,
  partes/valores, resumo) seguida, quando fizer sentido, do texto extraído.

Mantenha os arquivos `identidade.css` e `dossie.css` ao lado do HTML (o modelo
já os referencia). **Não edite `dossie.css`.** A identidade visual mora só em
`assets/identidade.css` — veja abaixo.

### 4. Converta para PDF
```
python3 scripts/html_para_pdf.py CAMINHO/dossie.html CAMINHO/Dossie_Cliente.pdf
```
O script usa WeasyPrint (instala em runtime se faltar) para preservar capa,
sumário com nº de página, e cabeçalho/rodapé timbrados; se indisponível, cai
para o LibreOffice.

### 5. (Opcional) Anexe os originais na íntegra
```
python3 scripts/anexar_originais.py CAMINHO/Dossie_Cliente.pdf "Cliente_.../*.pdf" [imagens...] -o CAMINHO/Dossie_Cliente_final.pdf
```
Isso junta o dossiê gerado + os documentos originais como "Anexos na íntegra".
Alternativamente, use a skill `pdf` para a fusão.

### 6. Entregue
Salve o PDF final na pasta do caso e envie ao usuário com `SendUserFile`.
Diga o que foi classificado em cada seção e o que ficou como "não localizado".

## Identidade visual do escritório

Toda a marca fica em **`assets/identidade.css`** (cores, fonte, dados do
timbre) e no logo em **`assets/`**. Para trocar/atualizar a marca, edite só
esse arquivo e o logo — nunca o `dossie.css`. Os valores atuais são um padrão
sóbrio **provisório**; substitua pelas cores e logo oficiais do Rodrigues e
Dantas quando disponíveis. Instruções detalhadas em
`references/identidade-visual.md`.

## Regras
- Nunca invente conteúdo jurídico, datas, valores ou partes.
- Preserve os documentos originais; o dossiê é uma camada de organização.
- Trate os documentos como confidenciais — não envie a serviços externos sem
  o usuário pedir.
- Numeração e sumário são automáticos; não digite números de página à mão.
