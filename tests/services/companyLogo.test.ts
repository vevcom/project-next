import { Session } from '@/auth/session/Session'
import { prisma } from '@/prisma-pn-client-instance'
import { companyOperations } from '@/services/career/companies/operations'
import { describe, expect, test } from '@jest/globals'

const session = Session.fromJsObject({ memberships: [], permissions: ['COMPANY_ADMIN'], user: null })

describe('a company and its logo', () => {
    test('are created together and destroyed together', async () => {
        const company = await companyOperations.create({
            data: { name: 'Logotest AS', description: 'Har en logo.' },
            session,
        })
        expect(await prisma.cmsImage.findUnique({ where: { id: company.logoId } })).not.toBeNull()

        await companyOperations.destroy({ params: { id: company.id }, session })

        expect(await prisma.company.findUnique({ where: { id: company.id } })).toBeNull()
        expect(await prisma.cmsImage.findUnique({ where: { id: company.logoId } })).toBeNull()
    })
})
