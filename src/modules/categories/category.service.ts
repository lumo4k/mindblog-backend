import { prisma } from '../../lib/prisma';

export async function getActiveCategories() {
    return prisma.category.findMany({
        where: {
            isActive: true,
        },

        orderBy: {
            name: 'asc',
        },

        select: {
            id: true,
            name: true,
        },
    });
}