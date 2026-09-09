#!/usr/bin/env python3
"""
Converte o HTML do dossiê em PDF, preservando capa, sumário com número de
página e cabeçalho/rodapé timbrados.

Uso:
    python3 html_para_pdf.py ENTRADA.html SAIDA.pdf

Estratégia:
  1. WeasyPrint (preferido) — respeita @page, running headers/footers e o
     sumário com target-counter. Instala em runtime se não estiver presente.
  2. LibreOffice (fallback) — se o WeasyPrint não puder ser usado. Mantém o
     visual, mas sem os recursos avançados de numeração de sumário.

Os arquivos identidade.css e dossie.css devem estar na MESMA pasta do HTML
(o base_url é a pasta do HTML, então o logo e o CSS são resolvidos por caminho
relativo).
"""
import os
import subprocess
import sys


def com_weasyprint(entrada: str, saida: str) -> bool:
    try:
        from weasyprint import HTML
    except ImportError:
        print("WeasyPrint ausente — tentando instalar...", file=sys.stderr)
        r = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", "weasyprint"],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            print("Não foi possível instalar o WeasyPrint:\n" + r.stderr,
                  file=sys.stderr)
            return False
        try:
            from weasyprint import HTML
        except Exception as e:  # noqa: BLE001
            print(f"WeasyPrint indisponível após instalação: {e}", file=sys.stderr)
            return False
    try:
        base = os.path.dirname(os.path.abspath(entrada))
        HTML(filename=entrada, base_url=base).write_pdf(saida)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"Falha no WeasyPrint: {e}", file=sys.stderr)
        return False


def com_libreoffice(entrada: str, saida: str) -> bool:
    soffice = None
    for cand in ("libreoffice", "soffice"):
        from shutil import which
        if which(cand):
            soffice = cand
            break
    if not soffice:
        print("LibreOffice não encontrado.", file=sys.stderr)
        return False
    outdir = os.path.dirname(os.path.abspath(saida)) or "."
    r = subprocess.run(
        [soffice, "--headless", "--convert-to", "pdf", "--outdir", outdir,
         os.path.abspath(entrada)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("Falha no LibreOffice:\n" + r.stderr, file=sys.stderr)
        return False
    gerado = os.path.join(
        outdir, os.path.splitext(os.path.basename(entrada))[0] + ".pdf")
    if gerado != os.path.abspath(saida) and os.path.exists(gerado):
        os.replace(gerado, saida)
    return os.path.exists(saida)


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    entrada, saida = sys.argv[1], sys.argv[2]
    if not os.path.exists(entrada):
        print(f"Arquivo não encontrado: {entrada}", file=sys.stderr)
        return 1
    if com_weasyprint(entrada, saida):
        print(f"PDF gerado (WeasyPrint): {saida}")
        return 0
    print("Usando fallback LibreOffice...", file=sys.stderr)
    if com_libreoffice(entrada, saida):
        print(f"PDF gerado (LibreOffice): {saida}")
        return 0
    print("Não foi possível gerar o PDF por nenhum método.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
