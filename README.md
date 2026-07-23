# Back - SistemaBlog

API HTTP do SistemaBlog. O backend expoe recursos para usuarios, autenticacao, artigos, categorias, comentarios, curtidas, upload de imagens e metricas de dashboard. A aplicacao usa Express, TypeScript, Prisma e MariaDB/MySQL.

## Stack

- Node.js com TypeScript.
- Express 5.
- Prisma 7 com adapter MariaDB.
- MySQL 8.4 via Docker Compose.
- JWT em cookie HttpOnly para autenticacao.
- `bcrypt` para hash de senha.
- `multer` em memoria para upload de imagens.
- `helmet`, `cors` e `cookie-parser` como middlewares globais.

## Como executar

Instale as dependencias:

```bash
npm install
```

Suba o banco local:

```bash
docker compose up -d
```

Aplique as migrations e gere o client Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

Inicie a API em desenvolvimento:

```bash
npm run dev
```

Por padrao, a API roda em `http://localhost:3333`.

## Variaveis de ambiente

Crie um `.env` no diretorio `back` com valores equivalentes aos usados pelo Docker, Prisma e API.

```env
PORT=3333
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

JWT_SECRET=troque-por-um-segredo-forte
JWT_EXPIRES_IN=7d

MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=sistema_blog
MYSQL_USER=sistema_blog
MYSQL_PASSWORD=sistema_blog
MYSQL_PORT=3307

DATABASE_URL=mysql://sistema_blog:sistema_blog@localhost:3307/sistema_blog
SHADOW_DATABASE_URL=mysql://sistema_blog:sistema_blog@localhost:3307/sistema_blog_shadow
```

Observacao: o runtime em `src/lib/prisma.ts` conecta pelo adapter MariaDB usando `MYSQL_HOST` fixo como `localhost`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_DATABASE`. Ja o Prisma CLI usa `DATABASE_URL` e `SHADOW_DATABASE_URL` definidos em `prisma.config.ts`.

## Scripts

- `npm run dev`: inicia `tsx watch src/server.ts`.
- `npm run build`: compila TypeScript para `dist`.
- `npm run start`: executa `node dist/server.js`.
- `npm run seed:content`: popula usuarios, artigos, curtidas e comentarios de demonstracao.

O seed padrao configurado em `prisma.config.ts` e `prisma/seed.ts`, usado pelo Prisma, cria categorias iniciais.

## Estrutura principal

- `src/server.ts`: carrega variaveis de ambiente e abre a porta HTTP.
- `src/app.ts`: configura Express, middlewares globais, prefixo `/api`, 404 e tratamento de erro.
- `src/routes/index.ts`: agrega os modulos da API e expoe `/api/health`.
- `src/modules/auth`: login, usuario autenticado e logout.
- `src/modules/users`: cadastro, perfil, imagem de perfil, dashboard e atividade recente.
- `src/modules/articles`: CRUD de artigos, listagens, imagens, curtidas e comentarios.
- `src/modules/categories`: listagem de categorias ativas.
- `src/middlewares`: autenticacao obrigatoria/opcional, upload de imagens, 404 e erros.
- `src/lib/prisma.ts`: instancia unica do Prisma Client com adapter MariaDB.
- `prisma/schema.prisma`: modelos de dados.
- `prisma/migrations`: historico SQL do banco.
- `prisma/seed.ts`: categorias base.
- `prisma/seed-content.ts`: conteudo demonstrativo.
- `compose.yaml`: container MySQL local.

## Modelo de dados

O schema Prisma define:

- `User`: usuarios com nome, email unico, senha hasheada, bio e imagem de perfil em `LongBlob`.
- `Category`: categorias ativas/inativas para classificar artigos.
- `Article`: artigos com titulo, resumo, conteudo, capa em `LongBlob`, contador de visualizacoes, autor e categoria.
- `Tag` e `ArticleTag`: tags normalizadas e relacionamento ordenado por artigo.
- `ArticleLike`: curtidas de artigos por usuario, com chave composta `userId` + `articleId`.
- `ArticleComment`: comentarios em artigos.
- `CommentLike`: curtidas de comentarios por usuario, com chave composta `userId` + `commentId`.

## Autenticacao

O login valida email e senha com `bcrypt`, assina um JWT com `JWT_SECRET` e grava o token no cookie `auth_token`.

Configuracao do cookie:

- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: true` somente em `NODE_ENV=production`
- validade de 7 dias no cookie

Rotas protegidas usam `authenticate`, que valida o cookie e grava `response.locals.userId`. Rotas que podem funcionar com ou sem sessao usam `optionalAuthenticate`.

## Uploads

Uploads usam `multer.memoryStorage()` e gravam o arquivo diretamente no banco como bytes.

Regras atuais:

- Campo `coverImage` para capa de artigo.
- Campo `profileImage` para foto de perfil.
- Tamanho maximo de 5 MB.
- MIME types aceitos: `image/jpeg`, `image/png`, `image/webp`.

## Endpoints

Todos os endpoints abaixo usam o prefixo `/api`.

### Saude

- `GET /health`: verifica se a API esta respondendo.

### Auth

- `POST /auth/login`: autentica usuario e grava cookie.
- `GET /auth/me`: retorna o usuario da sessao atual. Requer autenticacao.
- `POST /auth/logout`: limpa o cookie de autenticacao.

### Usuarios

- `POST /users`: cria usuario.
- `PATCH /users/profile`: atualiza nome, bio e foto de perfil. Requer autenticacao e aceita `multipart/form-data`.
- `GET /users/:userId/profile-image`: retorna a imagem de perfil.
- `GET /users/me/articles`: lista artigos do usuario autenticado.
- `GET /users/me/dashboard`: retorna metricas do dashboard do usuario autenticado.
- `GET /users/me/recent-activity`: retorna comentarios recentes em artigos do usuario autenticado.

### Categorias

- `GET /categories`: lista categorias ativas ordenadas por nome.

### Artigos

- `GET /articles?page=1`: lista artigos paginados, 9 por pagina.
- `POST /articles`: cria artigo. Requer autenticacao e aceita `multipart/form-data`.
- `GET /articles/recent`: lista os 9 artigos mais recentes.
- `GET /articles/most-liked`: lista ate 6 artigos com mais curtidas.
- `GET /articles/:articleId`: retorna detalhe do artigo e incrementa visualizacoes.
- `GET /articles/:articleId/edit`: retorna dados para edicao. Requer autenticacao e autoria.
- `PATCH /articles/:articleId`: atualiza artigo. Requer autenticacao e autoria.
- `DELETE /articles/:articleId`: remove artigo. Requer autenticacao e autoria.
- `GET /articles/:articleId/cover-image`: retorna a imagem de capa.
- `POST /articles/:articleId/likes`: curte artigo. Requer autenticacao.
- `DELETE /articles/:articleId/likes`: remove curtida do artigo. Requer autenticacao.

### Comentarios

- `GET /articles/:articleId/comments`: lista comentarios do artigo.
- `POST /articles/:articleId/comments`: cria comentario no artigo. A regra de servico exige usuario valido.
- `PATCH /articles/comments/:commentId`: edita comentario. Requer autenticacao e autoria.
- `DELETE /articles/comments/:commentId`: remove comentario. Requer autenticacao e autoria.
- `POST /articles/comments/:commentId/likes`: curte comentario. Requer autenticacao.
- `DELETE /articles/comments/:commentId/likes`: remove curtida do comentario. Requer autenticacao.

## Validacoes principais

- Usuario exige nome, email, senha e confirmacao; senha minima de 8 caracteres.
- Email e normalizado para minusculas.
- Titulo de artigo: obrigatorio, maximo de 180 caracteres.
- Resumo de artigo: obrigatorio, maximo de 120 caracteres.
- Conteudo de artigo: obrigatorio, maximo de 8000 caracteres.
- Criacao de artigo exige imagem de capa.
- Artigo aceita no maximo 10 tags, cada uma entre 2 e 30 caracteres.
- Comentario exige conteudo e maximo de 1000 caracteres.
- Edicao e exclusao de artigos/comentarios validam autoria.

## Seeds

Para categorias base:

```bash
npx prisma db seed
```

Para conteudo demonstrativo:

```bash
npm run seed:content
```

O seed de conteudo espera que exista pelo menos um artigo com imagem de capa para reutilizar como capa dos artigos gerados. Ele cria usuarios ficticios com a senha `MindBlog@2026`.

## Estado atual e cuidados

- Nao ha testes automatizados configurados neste backend.
- `src/generated/prisma` e gerado pelo Prisma; nao edite manualmente.
- Imagens sao armazenadas no banco, o que simplifica o projeto local, mas pode aumentar o tamanho do banco em producao.
- O CORS permite `FRONTEND_URL` ou `http://localhost:5173` por padrao e precisa ficar alinhado com a origem real do frontend.
- As mensagens estao em portugues e sao propagadas pelo frontend quando a API retorna erro conhecido via `AppError`.
