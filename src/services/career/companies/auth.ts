import { Require } from '@/auth/authorizer/Require'

export const companyAuth = {
    // The footer sponsor strip renders on the logged-out front page, so this read needs no session.
    readSponsors: Require.nothing(),
    create: Require.permission('COMPANY_ADMIN'),
    readPage: Require.permission('COMPANY_USE'),
    update: Require.permission('COMPANY_ADMIN'),
    updateSponsorTier: Require.permission('COMPANY_ADMIN'),
    updateCmsImageLogo: Require.permission('COMPANY_ADMIN'),
    destroy: Require.permission('COMPANY_ADMIN'),
}
