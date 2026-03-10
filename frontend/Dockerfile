# Estágio 1: Build do React/Vite
FROM node:20-slim AS build
WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código e gerar o build de produção
COPY . .
# Nota: O endereço da API deve ser injetado aqui via variável de ambiente no Vite se necessário
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configuração padrão do Nginx para Single Page Application (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
