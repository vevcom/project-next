import { RequireNothing } from '@/auth/authorizer/RequireNothing'
import { RequireOneOfPermission } from '@/auth/authorizer/RequireOneOfPermission'

export const careerAuth = {
    readSpecialCmsParagraphCareerInfo: RequireNothing.staticFields({}),
    updateSpecialCmsParagraphContentCareerInfo: RequireOneOfPermission.staticFields({
        permissions: ['JOBAD_UPDATE', 'COMMITTEE_ADMIN']
    }),
    readSpecialCmsLink: RequireNothing.staticFields({}),
    updateSpecialCmsLink: RequireOneOfPermission.staticFields({
        permissions: ['JOBAD_UPDATE', 'COMMITTEE_ADMIN']
    })
} as const
