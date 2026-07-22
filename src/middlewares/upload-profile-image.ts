import multer from 'multer';

import { AppError } from '../errors/app-error';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
];

export const uploadProfileImage = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },

    fileFilter: (_request, file, callback) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new AppError(
                    'Formato de imagem inválido. Envie JPEG, PNG ou WEBP',
                    400,
                ),
            );
        }

        return callback(null, true);
    },
});