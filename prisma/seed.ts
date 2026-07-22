/// <reference types="node" />

import { prisma } from '../src/lib/prisma';

const categories = [
    'Desenvolvimento Web',
    'Desenvolvimento Mobile',
    'Infraestrutura',
    'Segurança',
];

async function seed() {
    for (const name of categories) {
        await prisma.category.upsert({
            where: {
                name,
            },
            update: {
                isActive: true,
            },
            create: {
                name,
                isActive: true,
            },
        });
    }

    console.log('Categorias cadastradas com sucesso.');
}

seed()
    .catch((error: unknown) => {
        console.error('Erro ao executar o seed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });