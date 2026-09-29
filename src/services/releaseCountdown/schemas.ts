import { z } from 'zod'

export const releaseCountdownSchemas = {
    unlock: z.object({
        password: z.string().min(1, 'Skriv inn passordet'),
    }),
}
