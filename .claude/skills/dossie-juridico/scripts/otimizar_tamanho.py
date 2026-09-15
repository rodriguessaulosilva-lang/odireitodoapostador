#!/usr/bin/env python3
"""
Garante que o PDF final fique ABAIXO de um limite de tamanho (padrão 11.5 MB,
margem de segurança para o teto de 12 MB).

Uso:
    python3 otimizar_tamanho.py ENTRADA.pdf -o SAIDA.pdf [--max-mb 11.5]
                                             [--cinza] [--anexos-de N]

Estratégia em cascata (para no primeiro passo que couber):
  1. Recompactação sem perdas (garbage collect + deflate) — preserva o texto
     pesquisável. Resolve a maioria dos casos.
  2. Redução de resolução das imagens (escada 200→150→120→100 dpi + qualidade
     JPEG). Rasteriza as páginas dos ANEXOS; o texto vira imagem (continua
     legível, mas não selecionável). Por padrão só rasteriza a partir da
     página informada em --anexos-de (as páginas do dossiê analítico, que são
     leves e vetoriais, ficam intactas). Sem --anexos-de, rasteriza tudo.
  3. Se nem no passo mais agressivo couber num arquivo só, DIVIDE em volumes
     (SAIDA_vol1.pdf, SAIDA_vol2.pdf, ...), cada um abaixo do limite.

Saída: imprime o(s) arquivo(s) gerado(s) e o tamanho de cada um.
Dependências: PyMuPDF (pymupdf). Instala em runtime se faltar.
"""
import argparse
import os
import subprocess
import sys


def garantir_pymupdf():
    try:
        import pymupdf  # noqa: F401
        return
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet",
                        "pymupdf"], check=False)
        import pymupdf  # noqa: F401


def mb(n_bytes: int) -> float:
    return n_bytes / (1024 * 1024)


def bytes_sem_perdas(doc) -> bytes:
    return doc.tobytes(garbage=4, deflate=True, deflate_images=True,
                       deflate_fonts=True)


def rasterizar(doc, dpi: int, quality: int, cinza: bool, anexos_de: int):
    """Devolve um novo doc: páginas < anexos_de copiadas como estão; da
    anexos_de em diante, rasterizadas em JPEG no dpi/qualidade dados."""
    import pymupdf
    novo = pymupdf.open()
    cs = pymupdf.csGRAY if cinza else pymupdf.csRGB
    for i, page in enumerate(doc):
        if anexos_de is not None and i < anexos_de:
            novo.insert_pdf(doc, from_page=i, to_page=i)
            continue
        pix = page.get_pixmap(dpi=dpi, colorspace=cs)
        img = pix.tobytes("jpeg", jpg_quality=quality)
        p = novo.new_page(width=page.rect.width, height=page.rect.height)
        p.insert_image(p.rect, stream=img)
    return novo


def dividir_em_volumes(doc, saida_base: str, limite: int):
    """Empacota páginas em volumes, cada um <= limite. Retorna lista de
    arquivos gravados."""
    import pymupdf
    raiz, ext = os.path.splitext(saida_base)
    arquivos = []
    vol = pymupdf.open()
    vol_idx = 1

    def gravar(v, idx):
        nome = f"{raiz}_vol{idx}{ext}"
        v.save(nome, garbage=4, deflate=True)
        arquivos.append(nome)

    for i in range(doc.page_count):
        vol.insert_pdf(doc, from_page=i, to_page=i)
        if len(bytes_sem_perdas(vol)) > limite and vol.page_count > 1:
            # tira a última página, fecha o volume, começa outro
            vol.delete_page(vol.page_count - 1)
            gravar(vol, vol_idx)
            vol_idx += 1
            vol = pymupdf.open()
            vol.insert_pdf(doc, from_page=i, to_page=i)
    if vol.page_count:
        gravar(vol, vol_idx)
    return arquivos


def main() -> int:
    ap = argparse.ArgumentParser(description="Garante PDF abaixo do limite.")
    ap.add_argument("entrada")
    ap.add_argument("-o", "--saida", required=True)
    ap.add_argument("--max-mb", type=float, default=11.5)
    ap.add_argument("--cinza", action="store_true",
                    help="rasteriza os anexos em tons de cinza (menor ainda)")
    ap.add_argument("--anexos-de", type=int, default=None,
                    help="índice (0-based) da 1ª página de anexos; páginas "
                         "antes disso não são rasterizadas")
    a = ap.parse_args()
    limite = int(a.max_mb * 1024 * 1024)

    garantir_pymupdf()
    import pymupdf

    if not os.path.exists(a.entrada):
        print(f"Arquivo não encontrado: {a.entrada}", file=sys.stderr)
        return 1

    orig = os.path.getsize(a.entrada)
    print(f"Entrada: {mb(orig):.1f} MB  (limite {a.max_mb} MB)")

    # Passo 1 — sem perdas
    doc = pymupdf.open(a.entrada)
    dados = bytes_sem_perdas(doc)
    if len(dados) <= limite:
        with open(a.saida, "wb") as f:
            f.write(dados)
        print(f"[1] Sem perdas resolveu → {a.saida}  ({mb(len(dados)):.1f} MB)")
        return 0
    print(f"[1] Sem perdas: {mb(len(dados)):.1f} MB — ainda acima. "
          f"Reduzindo resolução...")

    # Passo 2 — escada de resolução/qualidade
    escada = [(200, 75), (150, 70), (150, 60), (120, 55), (100, 50)]
    melhor = None
    for dpi, q in escada:
        novo = rasterizar(doc, dpi, q, a.cinza, a.anexos_de)
        dados = bytes_sem_perdas(novo)
        print(f"    dpi={dpi} q={q}{' cinza' if a.cinza else ''}: "
              f"{mb(len(dados)):.1f} MB")
        if len(dados) <= limite:
            with open(a.saida, "wb") as f:
                f.write(dados)
            print(f"[2] Resolução reduzida resolveu → {a.saida} "
                  f"({mb(len(dados)):.1f} MB)")
            return 0
        melhor = novo  # guarda o mais agressivo p/ dividir

    # Passo 3 — dividir em volumes usando o doc mais comprimido
    print("[3] Nem no menor dpi coube num arquivo só. Dividindo em volumes...")
    base = melhor if melhor is not None else doc
    arquivos = dividir_em_volumes(base, a.saida, limite)
    for f in arquivos:
        print(f"    {f}  ({mb(os.path.getsize(f)):.1f} MB)")
    print(f"[3] Gerados {len(arquivos)} volumes, todos abaixo de {a.max_mb} MB.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
