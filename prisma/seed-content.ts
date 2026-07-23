/// <reference types="node" />

import 'dotenv/config';

import bcrypt from 'bcrypt';

import { prisma } from '../src/lib/prisma';

const SEED_PASSWORD = 'MindBlog@2026';

interface SeedUser {
    fullName: string;
    email: string;
    bio: string;
}

interface SeedPost {
    title: string;
    summary: string;
    categoryName: string;
    tags: string[];
    authorIndex: number;
    viewCount: number;
    introduction: string;
    keyPoints: string[];
}

const seedUsers: SeedUser[] = [
    {
        fullName: 'Ana Martins',
        email: 'ana.martins@mindblog.dev',
        bio: 'Desenvolvedora backend interessada em APIs, arquitetura e qualidade de software.',
    },
    {
        fullName: 'Bruno Lima',
        email: 'bruno.lima@mindblog.dev',
        bio: 'Engenheiro de infraestrutura com foco em containers, cloud e observabilidade.',
    },
    {
        fullName: 'Carla Nunes',
        email: 'carla.nunes@mindblog.dev',
        bio: 'Desenvolvedora frontend especializada em React, acessibilidade e experiência do usuário.',
    },
    {
        fullName: 'Diego Rocha',
        email: 'diego.rocha@mindblog.dev',
        bio: 'Engenheiro de dados trabalhando com pipelines, SQL e processamento distribuído.',
    },
    {
        fullName: 'Elisa Moreira',
        email: 'elisa.moreira@mindblog.dev',
        bio: 'Profissional de segurança de aplicações e boas práticas para desenvolvimento web.',
    },
];

const seedPosts: SeedPost[] = [
    {
        title: 'Como estruturar uma API REST com Node.js e TypeScript',
        summary:
            'Uma estrutura prática para organizar controllers, services, rotas e validações em APIs Node.js.',
        categoryName: 'Desenvolvimento Web',
        tags: ['Node.js', 'TypeScript', 'API REST'],
        authorIndex: 0,
        viewCount: 184,
        introduction:
            'Uma API cresce rapidamente quando responsabilidades diferentes ficam misturadas no mesmo arquivo. Separar as camadas desde o início facilita testes, manutenção e evolução do produto.',
        keyPoints: [
            'As rotas devem apenas definir os endpoints e conectar middlewares aos controllers.',
            'Controllers recebem os dados HTTP, enquanto services concentram as regras de negócio.',
            'Erros conhecidos devem ser transformados em respostas previsíveis por um middleware central.',
        ],
    },
    {
        title: 'Connection Pooling no MySQL: por que sua API precisa disso',
        summary:
            'Entenda como pools de conexão reduzem latência e evitam a abertura excessiva de conexões.',
        categoryName: 'Infraestrutura',
        tags: ['MySQL', 'Performance', 'Backend'],
        authorIndex: 1,
        viewCount: 267,
        introduction:
            'Abrir uma nova conexão com o banco para cada requisição custa tempo e recursos. Um pool mantém conexões reutilizáveis e controla quantas operações simultâneas podem alcançar o banco.',
        keyPoints: [
            'O tamanho do pool deve considerar capacidade do banco, concorrência e duração média das consultas.',
            'Conexões precisam ser devolvidas ao pool mesmo quando uma operação termina com erro.',
            'Métricas de espera e saturação ajudam a identificar quando o pool está pequeno ou o banco está sobrecarregado.',
        ],
    },
    {
        title: 'React sem re-renderizações desnecessárias',
        summary:
            'Técnicas para reduzir renderizações, organizar estado e melhorar a performance de interfaces React.',
        categoryName: 'Desenvolvimento Web',
        tags: ['React', 'Frontend', 'Performance'],
        authorIndex: 2,
        viewCount: 321,
        introduction:
            'Nem toda renderização do React representa um problema. A otimização deve começar quando medições mostram componentes lentos ou atualizações que percorrem uma árvore grande demais.',
        keyPoints: [
            'Mantenha o estado próximo do componente que realmente precisa dele.',
            'Use memoização apenas quando o custo da renderização ou do cálculo justificar sua complexidade.',
            'Listas devem utilizar chaves estáveis para que o React preserve corretamente cada elemento.',
        ],
    },
    {
        title: 'Índices SQL: como acelerar consultas sem prejudicar escritas',
        summary:
            'Aprenda a escolher índices úteis e a evitar excesso de estruturas que deixam as escritas mais caras.',
        categoryName: 'Infraestrutura',
        tags: ['SQL', 'Banco de Dados', 'Performance'],
        authorIndex: 3,
        viewCount: 402,
        introduction:
            'Índices permitem localizar registros sem percorrer toda a tabela, mas cada índice também precisa ser atualizado durante inserções e alterações.',
        keyPoints: [
            'As colunas utilizadas em filtros, relacionamentos e ordenações são candidatas naturais a índices.',
            'A ordem das colunas em um índice composto muda quais consultas poderão utilizá-lo.',
            'Planos de execução devem ser analisados antes e depois de uma alteração para comprovar o ganho.',
        ],
    },
    {
        title: 'Protegendo APIs com cookies HttpOnly e JWT',
        summary:
            'Uma abordagem segura para autenticação com JWT armazenado em cookies protegidos pelo navegador.',
        categoryName: 'Segurança',
        tags: ['JWT', 'Segurança', 'Cookies'],
        authorIndex: 4,
        viewCount: 356,
        introduction:
            'Armazenar tokens em cookies HttpOnly reduz a exposição do token a scripts executados no navegador. Ainda assim, outras proteções precisam fazer parte da autenticação.',
        keyPoints: [
            'Cookies HttpOnly não podem ser lidos diretamente pelo JavaScript do frontend.',
            'SameSite, Secure, expiração e origem permitida precisam ser configurados de acordo com o ambiente.',
            'O backend deve validar assinatura, expiração e identificador do usuário em todas as rotas protegidas.',
        ],
    },
    {
        title: 'Docker Compose para ambientes locais reproduzíveis',
        summary:
            'Configure aplicação, banco e serviços auxiliares em um ambiente local previsível e versionado.',
        categoryName: 'Infraestrutura',
        tags: ['Docker', 'DevOps', 'Containers'],
        authorIndex: 1,
        viewCount: 298,
        introduction:
            'Um arquivo Docker Compose reduz diferenças entre máquinas e permite iniciar as dependências do projeto com um único comando.',
        keyPoints: [
            'Volumes persistem dados importantes mesmo quando os containers são recriados.',
            'Health checks evitam que a aplicação tente acessar um banco que ainda não terminou de iniciar.',
            'Credenciais e configurações sensíveis devem vir de variáveis de ambiente, não do arquivo versionado.',
        ],
    },
    {
        title: 'Prisma ORM: migrations seguras em projetos reais',
        summary:
            'Como versionar alterações do banco, revisar migrations e reduzir riscos durante a evolução do schema.',
        categoryName: 'Desenvolvimento Web',
        tags: ['Prisma', 'ORM', 'Migrations'],
        authorIndex: 0,
        viewCount: 211,
        introduction:
            'O schema da aplicação muda junto com o produto. Migrations registram essa evolução e permitem aplicar as mesmas alterações nos diferentes ambientes.',
        keyPoints: [
            'Toda migration deve ser revisada antes de chegar ao ambiente de produção.',
            'Alterações destrutivas exigem estratégia de migração e preservação dos dados existentes.',
            'Seeds devem ser idempotentes ou claramente separados entre dados essenciais e dados de demonstração.',
        ],
    },
    {
        title: 'Logs, métricas e traces: os três pilares da observabilidade',
        summary:
            'Descubra como combinar logs, métricas e rastreamento para investigar falhas em produção.',
        categoryName: 'Infraestrutura',
        tags: ['Observabilidade', 'Logs', 'Métricas'],
        authorIndex: 1,
        viewCount: 445,
        introduction:
            'Saber que uma aplicação está fora do ar é diferente de saber por que ela falhou. Observabilidade conecta sinais técnicos ao comportamento real do sistema.',
        keyPoints: [
            'Logs estruturados facilitam buscas e correlações entre eventos da mesma requisição.',
            'Métricas mostram tendências, saturação e mudanças de comportamento ao longo do tempo.',
            'Traces ajudam a localizar gargalos quando uma operação atravessa vários serviços.',
        ],
    },
    {
        title: 'Pipeline de dados: do arquivo bruto até uma tabela confiável',
        summary:
            'Etapas fundamentais para extrair, validar, transformar e disponibilizar dados para análise.',
        categoryName: 'Infraestrutura',
        tags: ['Engenharia de Dados', 'ETL', 'Pipeline'],
        authorIndex: 3,
        viewCount: 389,
        introduction:
            'Um pipeline de dados não é apenas uma sequência de scripts. Ele precisa controlar qualidade, falhas, reprocessamento e rastreabilidade.',
        keyPoints: [
            'A camada bruta deve preservar os dados recebidos para permitir auditoria e reprocessamento.',
            'Transformações precisam ser determinísticas para produzir o mesmo resultado ao receber a mesma entrada.',
            'Validações de schema, valores nulos e duplicidade devem acontecer antes da publicação dos dados.',
        ],
    },
    {
        title: 'Testes de integração em APIs Express',
        summary:
            'Valide rotas, banco de dados e autenticação com testes próximos do comportamento real da aplicação.',
        categoryName: 'Desenvolvimento Web',
        tags: ['Testes', 'Express', 'Backend'],
        authorIndex: 0,
        viewCount: 173,
        introduction:
            'Testes unitários isolam pequenas funções, enquanto testes de integração verificam se as partes do sistema colaboram corretamente.',
        keyPoints: [
            'A aplicação deve poder ser iniciada nos testes sem abrir uma porta HTTP real.',
            'O banco de testes precisa ser isolado para que os cenários não alterem dados de desenvolvimento.',
            'Cada teste deve preparar os dados necessários e limpar o estado criado durante sua execução.',
        ],
    },
    {
        title: 'CI/CD com GitHub Actions para projetos TypeScript',
        summary:
            'Automatize instalação, lint, testes e build antes que alterações sejam integradas ao projeto.',
        categoryName: 'Infraestrutura',
        tags: ['CI/CD', 'GitHub Actions', 'TypeScript'],
        authorIndex: 1,
        viewCount: 242,
        introduction:
            'Uma pipeline de integração contínua identifica erros antes que eles cheguem ao ambiente principal e padroniza as verificações feitas pela equipe.',
        keyPoints: [
            'O workflow deve instalar dependências usando o arquivo de lock versionado.',
            'Lint, testes e build precisam falhar de forma clara quando uma etapa não atende aos critérios.',
            'Secrets devem ser armazenados pelo provedor da pipeline e nunca incluídos no repositório.',
        ],
    },
    {
        title: 'Acessibilidade em componentes React',
        summary:
            'Práticas para criar interfaces navegáveis por teclado e compreensíveis por tecnologias assistivas.',
        categoryName: 'Desenvolvimento Web',
        tags: ['Acessibilidade', 'React', 'UX'],
        authorIndex: 2,
        viewCount: 208,
        introduction:
            'Acessibilidade começa com HTML semântico e comportamento previsível. Bibliotecas visuais não substituem uma estrutura correta.',
        keyPoints: [
            'Botões devem ser usados para ações e links para navegação entre páginas.',
            'Elementos interativos precisam ter foco visível e funcionar apenas com o teclado.',
            'Textos alternativos devem explicar o conteúdo relevante da imagem sem repetir informações próximas.',
        ],
    },
    {
        title: 'Mensageria com Kafka: quando faz sentido utilizar',
        summary:
            'Conheça os cenários em que eventos e processamento assíncrono justificam o uso do Kafka.',
        categoryName: 'Infraestrutura',
        tags: ['Kafka', 'Mensageria', 'Eventos'],
        authorIndex: 3,
        viewCount: 517,
        introduction:
            'Kafka é útil quando diferentes consumidores precisam processar eventos de forma independente e com capacidade de reprocessamento.',
        keyPoints: [
            'Partições permitem paralelismo, mas a ordenação é garantida apenas dentro de cada partição.',
            'Consumers do mesmo grupo dividem o trabalho realizado sobre um tópico.',
            'Eventos devem possuir contratos versionados para evitar quebra de consumidores existentes.',
        ],
    },
    {
        title: 'OWASP Top 10 aplicado a APIs modernas',
        summary:
            'Principais riscos de segurança em APIs e medidas práticas para reduzir a superfície de ataque.',
        categoryName: 'Segurança',
        tags: ['OWASP', 'API', 'Segurança'],
        authorIndex: 4,
        viewCount: 612,
        introduction:
            'Falhas de autorização, validação e configuração continuam entre os problemas mais frequentes em aplicações web.',
        keyPoints: [
            'Toda operação deve confirmar se o usuário possui permissão sobre o recurso solicitado.',
            'Entrada do cliente nunca deve ser considerada confiável, mesmo quando veio do próprio frontend.',
            'Mensagens de erro públicas não devem expor stack traces, credenciais ou detalhes internos.',
        ],
    },
    {
        title: 'Monolito modular antes dos microserviços',
        summary:
            'Por que começar com módulos bem definidos pode ser melhor que distribuir o sistema cedo demais.',
        categoryName: 'Desenvolvimento Web',
        tags: ['Arquitetura', 'Monolito', 'Microserviços'],
        authorIndex: 0,
        viewCount: 478,
        introduction:
            'Microserviços resolvem problemas organizacionais e de escala, mas também adicionam comunicação de rede, observabilidade e operação distribuída.',
        keyPoints: [
            'Um monolito modular permite separar domínios sem introduzir chamadas entre processos.',
            'Limites claros entre módulos facilitam uma futura extração quando ela realmente for necessária.',
            'A decisão deve considerar equipe, volume de mudanças e gargalos reais, não apenas tendências.',
        ],
    },
    {
        title: 'Feature Flags para entregar funcionalidades com segurança',
        summary:
            'Separe deploy de lançamento e controle gradualmente quem pode acessar uma nova funcionalidade.',
        categoryName: 'Desenvolvimento Web',
        tags: ['Feature Flags', 'Deploy', 'Produto'],
        authorIndex: 2,
        viewCount: 190,
        introduction:
            'Feature flags permitem colocar código em produção sem liberar imediatamente a funcionalidade para todos os usuários.',
        keyPoints: [
            'Flags podem segmentar usuários, ambientes ou percentuais de tráfego.',
            'Cada flag precisa de responsável e data prevista para remoção.',
            'Flags antigas aumentam caminhos condicionais e dificultam testes se permanecerem indefinidamente.',
        ],
    },
    {
        title: 'Qualidade de dados: regras que todo pipeline deveria validar',
        summary:
            'Validações essenciais para impedir que dados incompletos ou inconsistentes cheguem aos consumidores.',
        categoryName: 'Infraestrutura',
        tags: ['Qualidade de Dados', 'Data Engineering', 'Validação'],
        authorIndex: 3,
        viewCount: 333,
        introduction:
            'Dados podem chegar no formato correto e ainda assim estar errados. Qualidade exige regras técnicas e regras relacionadas ao negócio.',
        keyPoints: [
            'Completude mede se campos obrigatórios estão disponíveis para o uso esperado.',
            'Unicidade evita duplicações que distorcem agregações e indicadores.',
            'Testes de distribuição ajudam a detectar mudanças anormais mesmo quando o schema permanece igual.',
        ],
    },
    {
        title: 'Rate Limiting para proteger autenticação e APIs públicas',
        summary:
            'Controle a frequência de requisições e reduza abuso, força bruta e consumo excessivo de recursos.',
        categoryName: 'Segurança',
        tags: ['Rate Limiting', 'Segurança', 'Backend'],
        authorIndex: 4,
        viewCount: 421,
        introduction:
            'Endpoints públicos podem ser explorados por automações maliciosas ou clientes com comportamento incorreto.',
        keyPoints: [
            'Limites diferentes devem ser aplicados a login, leitura pública e operações mais caras.',
            'Identificação pode combinar endereço IP, usuário autenticado e chave de acesso.',
            'A resposta deve informar bloqueio temporário sem revelar detalhes sensíveis da proteção.',
        ],
    },
    {
        title: 'Cache em APIs: onde aplicar e quando invalidar',
        summary:
            'Estratégias para reduzir consultas repetidas sem entregar informações antigas aos usuários.',
        categoryName: 'Infraestrutura',
        tags: ['Cache', 'Redis', 'Performance'],
        authorIndex: 1,
        viewCount: 566,
        introduction:
            'Cache melhora o tempo de resposta quando os mesmos dados são consultados repetidamente, mas cria o desafio da invalidação.',
        keyPoints: [
            'Dados com alto volume de leitura e baixa frequência de alteração são bons candidatos.',
            'O tempo de expiração deve refletir quanto tempo uma informação pode permanecer desatualizada.',
            'A aplicação precisa continuar funcionando quando o serviço de cache estiver temporariamente indisponível.',
        ],
    },
    {
        title: 'Organizando estado global em aplicações React',
        summary:
            'Critérios para decidir entre estado local, Context API e bibliotecas de gerenciamento global.',
        categoryName: 'Desenvolvimento Web',
        tags: ['React', 'Estado Global', 'Frontend'],
        authorIndex: 2,
        viewCount: 287,
        introduction:
            'Mover todo estado para uma solução global aumenta o acoplamento e pode transformar alterações simples em atualizações amplas.',
        keyPoints: [
            'Estado utilizado por poucos componentes deve permanecer o mais próximo possível deles.',
            'Context funciona bem para informações estáveis como tema, sessão e preferências.',
            'Estados remotos vindos da API possuem necessidades diferentes de estados locais da interface.',
        ],
    },
];

const commentTemplates = [
    'Gostei bastante da abordagem prática. Vou aplicar esses pontos no meu próximo projeto.',
    'O conteúdo ficou direto e fácil de acompanhar. A parte sobre cuidados em produção foi muito útil.',
    'Excelente explicação. Seria interessante ver um exemplo completo desse assunto em um próximo artigo.',
];

function normalizeTagName(tagName: string): string {
    return tagName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function buildArticleContent(post: SeedPost): string {
    const points = post.keyPoints
        .map(
            (point, index) =>
                `### ${index + 1}. Ponto essencial\n\n${point}`,
        )
        .join('\n\n');

    return `# ${post.title}

${post.introduction}

## Por que esse assunto importa

${post.summary}

${points}

## Checklist prático

- Entenda o problema antes de escolher a ferramenta.
- Implemente a menor solução capaz de validar a ideia.
- Meça o comportamento da aplicação.
- Registre decisões e limitações encontradas.
- Revise a solução conforme o sistema crescer.

## Conclusão

${post.keyPoints[post.keyPoints.length - 1]}

A melhor abordagem depende do contexto, do volume de dados, da equipe responsável e dos requisitos reais do produto.`;
}

async function main() {
    const sourceCover = await prisma.article.findFirst({
        orderBy: {
            id: 'asc',
        },
        select: {
            coverImage: true,
            coverImageMimeType: true,
        },
    });

    if (!sourceCover) {
        throw new Error(
            'Nenhum artigo com capa foi encontrado. Crie um artigo manualmente antes de executar o seed.',
        );
    }

    const seedEmails = seedUsers.map((user) => user.email);

    console.log('Removendo dados anteriores do seed...');

    await prisma.user.deleteMany({
        where: {
            email: {
                in: seedEmails,
            },
        },
    });

    const categoryNames = [
        'Desenvolvimento Web',
        'Desenvolvimento Mobile',
        'Infraestrutura',
        'Segurança',
    ];

    const categoryIds = new Map<string, number>();

    for (const categoryName of categoryNames) {
        const category = await prisma.category.upsert({
            where: {
                name: categoryName,
            },
            update: {
                isActive: true,
            },
            create: {
                name: categoryName,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
            },
        });

        categoryIds.set(category.name, category.id);
    }

    const passwordHash = await bcrypt.hash(
        SEED_PASSWORD,
        10,
    );

    const createdUsers = [];

    console.log('Criando usuários...');

    for (const seedUser of seedUsers) {
        const user = await prisma.user.create({
            data: {
                fullName: seedUser.fullName,
                email: seedUser.email,
                passwordHash,
                bio: seedUser.bio,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
            },
        });

        createdUsers.push(user);
    }

    console.log('Criando artigos e interações...');

    for (const [postIndex, post] of seedPosts.entries()) {
        const categoryId = categoryIds.get(
            post.categoryName,
        );

        if (!categoryId) {
            throw new Error(
                `Categoria não encontrada: ${post.categoryName}`,
            );
        }

        const author = createdUsers[post.authorIndex];

        const article = await prisma.article.create({
            data: {
                title: post.title,
                summary: post.summary,
                content: buildArticleContent(post),
                viewCount: post.viewCount,
                coverImage: sourceCover.coverImage,
                coverImageMimeType:
                    sourceCover.coverImageMimeType,
                authorId: author.id,
                categoryId,

                tags: {
                    create: post.tags.map(
                        (tagName, position) => ({
                            position,

                            tag: {
                                connectOrCreate: {
                                    where: {
                                        normalizedName:
                                            normalizeTagName(
                                                tagName,
                                            ),
                                    },

                                    create: {
                                        name: tagName,
                                        normalizedName:
                                            normalizeTagName(
                                                tagName,
                                            ),
                                    },
                                },
                            },
                        }),
                    ),
                },
            },

            select: {
                id: true,
                title: true,
            },
        });

        const likeQuantity = (postIndex % 5) + 1;

        for (
            let likeIndex = 0;
            likeIndex < likeQuantity;
            likeIndex += 1
        ) {
            await prisma.articleLike.create({
                data: {
                    articleId: article.id,
                    userId: createdUsers[likeIndex].id,
                },
            });
        }

        const commentQuantity = (postIndex % 3) + 1;

        for (
            let commentIndex = 0;
            commentIndex < commentQuantity;
            commentIndex += 1
        ) {
            const commenter =
                createdUsers[
                (post.authorIndex +
                    commentIndex +
                    1) %
                createdUsers.length
                ];

            const comment =
                await prisma.articleComment.create({
                    data: {
                        articleId: article.id,
                        userId: commenter.id,
                        content:
                            commentTemplates[
                            commentIndex %
                            commentTemplates.length
                            ],
                    },

                    select: {
                        id: true,
                    },
                });

            const commentLikeQuantity =
                (commentIndex % 2) + 1;

            let createdCommentLikes = 0;

            for (const user of createdUsers) {
                if (user.id === commenter.id) {
                    continue;
                }

                await prisma.commentLike.create({
                    data: {
                        commentId: comment.id,
                        userId: user.id,
                    },
                });

                createdCommentLikes += 1;

                if (
                    createdCommentLikes >=
                    commentLikeQuantity
                ) {
                    break;
                }
            }
        }

        console.log(
            `Artigo ${postIndex + 1}/20 criado: ${article.title}`,
        );
    }

    console.log('');
    console.log('Seed concluído com sucesso.');
    console.log(`Usuários criados: ${createdUsers.length}`);
    console.log(`Artigos criados: ${seedPosts.length}`);
    console.log(`Senha dos usuários: ${SEED_PASSWORD}`);
    console.log('');
    console.log('Contas:');

    for (const user of createdUsers) {
        console.log(`- ${user.email}`);
    }
}

main()
    .catch((error: unknown) => {
        console.error('Erro ao executar seed:');
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });