# 📅 Resumo e Próximos Passos (10/03)

## ✅ Realizado Hoje
- **Dashboard Funcional**: Criado endpoint no Django para estatísticas reais (consultas, pacientes, estoque baixo).
- **Interface Inteligente**: Gráfico com eixo Y dinâmico e lista de atendimentos recentes com rolagem interna (padrão de 3 itens).
- **RBAC (Controle de Acesso)**: Implementado sistema de permissões por cargo. O menu agora é dinâmico e esconde itens não permitidos.
- **Tradução de Perfis**: Todos os cargos agora aparecem em Português em todo o sistema (Recepção, Médico, etc.).
- **Correção de Login**: Fim do "login em duas etapas". Agora o sistema aguarda o perfil antes de redirecionar.
- **Git Atualizado**: Todo o código foi enviado para o repositório oficial.

---

## 🚀 Guia de Implantação no Servidor (Docker)

Siga este passo a passo para tirar o projeto do seu PC e colocar no servidor de produção.

### 1. Preparação dos Arquivos
No servidor, clone o repositório ou copie a pasta `app_clinica`.
Certifique-se de que o arquivo `.env` no servidor tenha as configurações de rede corretas:
```env
# No Servidor, troque 127.0.0.1 pelo IP Real do Servidor se necessário
DATABASE_URL=postgres://clinica_user:clinica_pass@db:5432/clinica_db
DJANGO_DEBUG=False
```

### 2. Configurando o Frontend para o IP do Servidor
O arquivo `frontend/src/api.ts` aponta para `127.0.0.1`. Para que outros PCs acessem, precisamos mudar para o IP do servidor:
1. Abra `frontend/src/api.ts`.
2. Troque `http://127.0.0.1:8001` pelo IP do servidor (ex: `http://192.168.1.50:8001`).

### 3. Subindo com Docker
No terminal do servidor, dentro da pasta `app_clinica`:
```bash
# Constrói e sobe os containers em segundo plano
docker-compose up -d --build

# Executa as migrações do banco de dados dentro do container
docker-compose exec web python manage.py migrate

# Cria o primeiro administrador (Siga as instruções na tela)
docker-compose exec web python manage.py createsuperuser
```

### 4. Como os funcionários acessam?
- **URL do Sistema**: `http://IP_DO_SERVIDOR:5173` (Frontend)
- **URL da API**: `http://IP_DO_SERVIDOR:8001` (Backend/Admin)

---

## 📋 A Fazer (Prioridades)

### 📊 Relatórios Dinâmicos
- Criar módulo de exportação para PDF/Excel.
- Relatório de Produtividade por Médico.
- Relatório de Consumo de Medicamentos (Kardex).

### 📺 Painel de Chamada (Recepção)
- **O que é**: Uma tela em "Modo Quiosque" que fica na TV da recepção.
- **Como fazer**: 
    1. Criar uma rota `/painel-chamada` no Frontend.
    2. Usar **WebSockets (Django Channels)** ou **Polling** para avisar quando um médico "chama" o próximo paciente.
    3. Adicionar efeito sonoro ("Ding") e voz sintética (opcional) para anunciar o nome.
    4. Na TV, basta abrir o navegador no endereço `http://IP_DO_SERVIDOR:5173/painel-chamada` e apertar `F11` (Tela Cheia).

### 🏥 Fluxo Clínico
- Finalizar a tela de Triagem (Sinais Vitais).
- Integrar a chamada do painel diretamente da tela do Médico.

---

> [!TIP]
> **Dica para o Servidor**: Se o Docker já está instalado, use o `docker-compose.yml` que já deixamos configurado. Ele isola o banco de dados e evita conflitos com outros programas da máquina.
