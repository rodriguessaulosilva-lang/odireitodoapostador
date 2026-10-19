#!/usr/bin/env python3
"""
Importa dados de financeiro da planilha Excel para Supabase.
Uso: python import-financeiro.py <path-to-excel>
"""

import sys
import os
import json
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd
import requests

# Config
SUPABASE_URL = "https://gpnsgquyfwbouwswpxzj.supabase.co"
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_ID = "24fd8a0b-e91c-4caf-906d-797c88bb18a5"  # Saulo Rodrigues admin user

# Meses para conversão (português -> número)
MESES_MAP = {
    "Abril": (4, 2024),
    "Maio": (5, 2024),
    "Junho": (6, 2024),
    "Julho": (7, 2024),
    "Agosto": (8, 2024),
    "Setembro": (9, 2024),
    "Outubro": (10, 2024),
    "Novembro": (11, 2024),
    "Dezembro": (12, 2024),
    "Janeiro": (1, 2025),
    "Fevereiro": (2, 2025),
    "Março": (3, 2025),
}

def get_headers():
    return {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

def read_excel(filepath):
    """Lê a planilha e retorna DataFrame."""
    df = pd.read_excel(filepath, sheet_name="Planilha1")
    return df

def get_or_create_cliente(nome, cpf=None):
    """Obtém ou cria um cliente pelo nome."""
    # Buscar cliente existente
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/clientes",
        headers=get_headers(),
        params={"nome_completo": f"eq.{nome}"},
    )
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]

    # Criar novo
    data = {
        "nome_completo": nome,
        "cpf_cnpj": cpf or None,
        "escopo": "escritorio",
        "etapa_funil": "contratado",
        "created_by": ADMIN_ID,
    }
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/clientes",
        headers=get_headers(),
        json=data,
    )
    if res.status_code in (200, 201):
        return res.json()[0]["id"] if isinstance(res.json(), list) else res.json()["id"]
    print(f"❌ Erro ao criar cliente {nome}: {res.text}")
    return None

def create_honorario(cliente_id, valor_total, num_parcelas):
    """Cria um registro de honorário."""
    data = {
        "cliente_id": cliente_id,
        "tipo": "parcelado",
        "valor_total": float(valor_total),
        "valor_recebido": 0,
        "num_parcelas": num_parcelas,
    }
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/honorarios",
        headers=get_headers(),
        json=data,
    )
    if res.status_code in (200, 201):
        return res.json()[0]["id"] if isinstance(res.json(), list) else res.json()["id"]
    print(f"❌ Erro ao criar honorário: {res.text}")
    return None

def create_parcela(honorario_id, numero, valor, vencimento):
    """Cria um registro de parcela."""
    data = {
        "honorario_id": honorario_id,
        "numero": numero,
        "valor": float(valor),
        "vencimento": vencimento.strftime("%Y-%m-%d"),
        "status": "pendente",
    }
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/parcelas",
        headers=get_headers(),
        json=data,
    )
    if res.status_code not in (200, 201):
        print(f"❌ Erro ao criar parcela: {res.text}")
        return False
    return True

def import_financeiro(filepath):
    """Importa os dados da planilha."""
    df = read_excel(filepath)

    # Skip header row, pega só clientes
    clientes_data = []
    for idx, row in df.iterrows():
        cliente_nome = row.get("Clientes")
        if not cliente_nome or pd.isna(cliente_nome) or cliente_nome in ["Receita", "Custos", "Lucro", "VALOR PARA CADA UM"]:
            continue

        valor_total = row.get("Despesa")
        if pd.isna(valor_total):
            continue

        valor_total = float(valor_total)
        if valor_total <= 0:
            continue

        clientes_data.append({
            "nome": cliente_nome,
            "valor_total": valor_total,
            "parcelas_meses": {},  # {mes: valor}
            "row": row,
        })

    # Extrair valores por mês para cada cliente
    for cliente in clientes_data:
        row = cliente["row"]
        for mes, (mes_num, ano) in MESES_MAP.items():
            valor = row.get(mes)
            if not pd.isna(valor) and float(valor) > 0:
                cliente["parcelas_meses"][mes] = {
                    "mes": mes_num,
                    "ano": ano,
                    "valor": float(valor),
                }

    # Importar para Supabase
    print(f"📥 Importando {len(clientes_data)} clientes...\n")

    for cliente in clientes_data:
        print(f"🔄 {cliente['nome']} (total: R$ {cliente['valor_total']})")

        # Criar/obter cliente
        cliente_id = get_or_create_cliente(cliente["nome"])
        if not cliente_id:
            print(f"⚠️ Pulando {cliente['nome']}")
            continue

        # Criar honorário
        num_parcelas = len(cliente["parcelas_meses"])
        if num_parcelas == 0:
            print(f"⚠️ Sem parcelas cadastradas para {cliente['nome']}")
            continue

        honorario_id = create_honorario(cliente_id, cliente["valor_total"], num_parcelas)
        if not honorario_id:
            print(f"⚠️ Pulando parcelas de {cliente['nome']}")
            continue

        # Criar parcelas
        for numero, (mes_nome, parcela_info) in enumerate(cliente["parcelas_meses"].items(), 1):
            vencimento = datetime(parcela_info["ano"], parcela_info["mes"], 15)
            create_parcela(honorario_id, numero, parcela_info["valor"], vencimento)

        print(f"✅ {cliente['nome']}: {num_parcelas} parcelas criadas\n")

    print("✨ Importação concluída!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python import-financeiro.py <path-to-excel>")
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"❌ Arquivo não encontrado: {filepath}")
        sys.exit(1)

    if not SERVICE_ROLE_KEY:
        print("❌ SUPABASE_SERVICE_ROLE_KEY não definida!")
        sys.exit(1)

    import_financeiro(filepath)
