# Direitos dos Apostadores

Landing page + (futuro) motor de conteúdo do projeto **Direitos dos Apostadores**
— uma iniciativa de Rodrigues e Dantas Advogados Associados.

## Estrutura

```
odireitodoapostador/
├── index.html        # Página inicial (landing page) — servida automaticamente
├── images/           # Imagens (foto do homem preocupado, tela de celular etc.)
│   └── LEIA-ME.md    # Nomes exatos dos arquivos de imagem
└── README.md
```

## Como publicar (hospedagem gratuita)

### Opção rápida — Netlify Drop (sem GitHub)
1. Acesse https://app.netlify.com/drop
2. Arraste a pasta do projeto (com `index.html` e a pasta `images/`)
3. O site fica no ar em segundos.

### Opção recomendada — GitHub + Netlify (re-deploy automático)
1. Suba estes arquivos no repositório GitHub.
2. Em https://app.netlify.com → **Add new site → Import from Git** → selecione o repositório.
3. Build command: *(vazio)* · Publish directory: `/` (raiz).
4. Cada novo commit republica o site sozinho.

## Domínio
`direitodosapostadores.com.br` — registrado em https://registro.br
(configuração de DNS apontando para o Netlify).

## Pendências da landing page
- [ ] Inserir o **ID do Formspree** (substituir `xpwzgekv` em `index.html`).
- [ ] Inserir o **número de WhatsApp** (substituir `wa.me/55`).
- [ ] Adicionar `images/homem-preocupado.jpg` e `images/tela-casa-apostas.png`.
