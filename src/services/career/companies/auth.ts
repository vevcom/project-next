import { Require } from '@/auth/authorizer/Require'

export const companyAuth = {
    create: Require.permission('COMPANY_ADMIN'),
    readPage: Require.permission('COMPANY_USE'),
    update: Require.permission('COMPANY_ADMIN'),
    updateCmsImageLogo: Require.permission('COMPANY_ADMIN'),
    destroy: Require.permission('COMPANY_ADMIN'),
}
