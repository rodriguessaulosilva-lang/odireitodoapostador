#!/usr/bin/env python3
"""
Anexa os documentos originais (na íntegra) ao final do dossiê gerado.

Uso:
    python3 anexar_originais.py DOSSIE.pdf ARQUIVO1 [ARQUIVO2 ...] -o SAIDA.pdf

Aceita PDFs e imagens (jpg, jpeg, png). Imagens são convertidas em páginas PDF.
A ordem dos anexos segue a ordem passada na linha de comando. Use aspas e
curingas do shell para uma pasta inteira, ex.:
    python3 anexar_originais.py Dossie.pdf "Cliente_Silva/"*.pdf -o Dossie_final.pdf

Dependências: pypdf e Pillow (instaladas em runtime se faltarem).
"""
import os
import subprocess
import sys


def garantir(pacote: str, modulo: str) -> bool:
    try:
        __import__(modulo)
        return True
    except ImportError:
        r = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", pacote],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            print(f"Não foi possível instalar {pacote}:\n{r.stderr}", file=sys.stderr)
            return False
        try:
            __import__(modulo)
            return True
        except Exception:  # noqa: BLE001
            return False


def imagem_para_pdf_bytes(caminho: str) -> bytes:
    from io import BytesIO
    from PIL import Image
    img = Image.open(caminho)
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="PDF", resolution=150.0)
    return buf.getvalue()


def main() -> int:
    args = sys.argv[1:]
    if "-o" not in args or len(args) < 4:
        print(__doc__)
        return 2
    oi = args.index("-o")
    saida = args[oi + 1]
    entradas = args[:oi]
    dossie = entradas[0]
    anexos = entradas[1:]

    if not garantir("pypdf", "pypdf"):
        print("pypdf indisponível.", file=sys.stderr)
        return 1
    from pypdf import PdfWriter, PdfReader
    from io import BytesIO

    writer = PdfWriter()
    for p in PdfReader(dossie).pages:
        writer.add_page(p)

    img_ext = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp")
    for a in anexos:
        if not os.path.exists(a):
            print(f"  ignorado (não existe): {a}", file=sys.stderr)
            continue
        ext = os.path.splitext(a)[1].lower()
        try:
            if ext == ".pdf":
                for p in PdfReader(a).pages:
                    writer.add_page(p)
            elif ext in img_ext:
                if not garantir("Pillow", "PIL"):
                    print(f"  ignorada imagem (Pillow ausente): {a}", file=sys.stderr)
                    continue
                for p in PdfReader(BytesIO(imagem_para_pdf_bytes(a))).pages:
                    writer.add_page(p)
            else:
                print(f"  ignorado (tipo não suportado): {a}", file=sys.stderr)
                continue
            print(f"  anexado: {a}")
        except Exception as e:  # noqa: BLE001
            print(f"  erro ao anexar {a}: {e}", file=sys.stderr)

    with open(saida, "wb") as f:
        writer.write(f)
    print(f"PDF final com anexos: {saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
