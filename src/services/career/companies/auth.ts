import { Require } from '@/auth/authorizer/Require'

export const companyAuth = {
    // The sponsor strip is public branding shown in the footer of the logged-out front page, so this
    // read cannot require a session the way the rest of the company service does.
    readSponsors: Require.nothing(),
    create: Require.permission('COMPANY_ADMIN'),
    readPage: Require.permission('COMPANY_USE'),
    update: Require.permission('COMPANY_ADMIN'),
    updateSponsorTier: Require.permission('COMPANY_ADMIN'),
    updateCmsImageLogo: Require.permission('COMPANY_ADMIN'),
    destroy: Require.permission('COMPANY_ADMIN'),
}
