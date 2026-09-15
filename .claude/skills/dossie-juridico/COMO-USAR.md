# Como usar a skill "Dossiê Jurídico" — Rodrigues e Dantas

Guia prático, sem tecnês. Esta skill monta um **dossiê em PDF** a partir dos
documentos de um cliente: com **capa**, **sumário** e os documentos
**organizados por tipo**, tudo com a **identidade visual do escritório**.

---

## 1. Como enviar os arquivos

Organize **uma pasta por cliente** e coloque dentro **todos** os documentos
(PDFs, fotos de RG, prints de WhatsApp, contratos, comprovantes etc.).
O nome de cada arquivo ajuda — quanto mais descritivo, melhor.

Exemplo:

```
Cliente_Maria_Silva/
├── rg_maria.pdf
├── certidao_casamento.pdf
├── comprovante_residencia.pdf
├── matricula_imovel.pdf
├── contrato_compra_venda.pdf
└── prints_whatsapp.pdf
```

Você pode:
- **Arrastar a pasta/arquivos** para o chat do Claude Code; ou
- Apontar uma **pasta do Google Drive** (posso ler de lá); ou
- Colocar a pasta dentro do projeto e me dizer o caminho.

> Dica: aceita documentos escaneados — faço OCR (leitura do texto da imagem).

---

## 2. O que me dizer ao pedir

Basta algo como:

> "Monte o dossiê do cliente **Maria Silva**. É um caso de **divórcio com
> partilha**. Processo **nº 000-00**, na **2ª Vara de Família de Goiânia**.
> Anexe os documentos originais no final."

Se faltar algum dado (processo, vara), eu pergunto ou marco como
"não localizado" — **nunca invento** datas, valores ou partes.

---

## 3. O que você recebe

Um **PDF** com:
1. **Capa** com logo, cores do escritório e os dados do caso + resumo.
2. **Sumário** com os documentos e o número da página de cada um.
3. **Seções por tipo de documento**: Identificação → Comprovantes →
   Contratos/Títulos → Provas e Comunicações → Peças Processuais →
   Procuração/Honorários → Outros.
4. Cada documento com uma **ficha** (tipo, data, partes/valores, resumo).
5. (Opcional) Os **documentos originais na íntegra** anexados ao final.

---

## 4. Identidade visual do escritório (faça uma vez)

Para o dossiê sair com a marca do Rodrigues e Dantas, me envie **uma vez**:
- o **logo** (PNG/SVG em boa resolução),
- as **cores** oficiais (ou só o logo, que eu extraio as cores),
- a **fonte** e os dados do **timbre** (OAB, e-mail, telefone, endereço).

Eu configuro no arquivo `assets/identidade.css` e, a partir daí, **todos** os
dossiês saem com a identidade aplicada. Enquanto isso, uso um padrão sóbrio
provisório.

---

## 5. Tamanho do arquivo (limite de 12 MB)

O texto do dossiê é levíssimo (poucos KB). O que pesa são os **documentos
escaneados e fotos** anexados. A skill garante que **nada saia acima de 12 MB**,
nesta ordem:

1. **Dossiê e anexos separados** — entrego o **dossiê analítico** (capa,
   sumário e fichas) num arquivo leve e pesquisável, e os **originais** em
   outro. Só isso já resolve quase sempre, e você envia os dois separados.
2. **Compressão automática** — se os anexos ainda passarem do limite, reduzo a
   resolução das imagens até caber (documentos continuam legíveis). Ex. real
   do teste: **71 MB → 6 MB**. Para escaneados em preto-e-branco, fica menor
   ainda.
3. **Divisão em volumes** — se mesmo comprimido não couber num arquivo só
   (caso raro, com centenas de páginas), divido em **Volume 1, Volume 2…**,
   cada um abaixo de 12 MB, sem perder nenhuma página.

Você não precisa fazer nada: eu aplico e te informo o tamanho final e, se
dividi, quantos volumes. Se preferir um teto menor (ex.: 10 MB para e-mail),
é só pedir.

> Dica para reduzir na origem: escaneie em **preto-e-branco/tons de cinza** e
> em **200–300 dpi** (em vez de colorido em alta), e prefira PDF a fotos.

## 6. Dúvidas comuns

- **Posso mudar a ordem das seções?** Sim — me diga a ordem que prefere, ou
  que use ordem cronológica.
- **Tenho muitos clientes.** Uma pasta por cliente; processo um de cada vez.
- **Os documentos são sigilosos.** Ficam no ambiente da sessão; não envio a
  serviços externos sem você pedir.
- **Quero em Word também.** Dá para gerar — é só pedir (o padrão é PDF).

---

*Detalhes técnicos em `SKILL.md`. Identidade visual em
`references/identidade-visual.md`.*
