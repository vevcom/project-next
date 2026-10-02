import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequireNothing } from '@/auth/authorizer/RequireNothing'

export const companyAuth = {
    // The footer sponsor strip renders on the logged-out front page, so this read needs no session.
    readSponsors: RequireNothing.staticFields({}),
    create: RequirePermission.staticFields({ permission: 'COMPANY_ADMIN' }),
    readPage: RequirePermission.staticFields({ permission: 'COMPANY_READ' }),
    update: RequirePermission.staticFields({ permission: 'COMPANY_ADMIN' }),
    updateSponsorTier: RequirePermission.staticFields({ permission: 'COMPANY_ADMIN' }),
    updateCmsImageLogo: RequirePermission.staticFields({ permission: 'COMPANY_ADMIN' }),
    destroy: RequirePermission.staticFields({ permission: 'COMPANY_ADMIN' }),
}
