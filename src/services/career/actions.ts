'use server'
import { careerOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const readSpecialCmsParagraphCareerInfo = makeAction(
    careerOperations.readSpecialCmsParagraphCareerInfo
)
export const updateSpecialCmsParagraphContentCareerInfo = makeAction(
    careerOperations.updateSpecialCmsParagraphContentCareerInfo
)

export const updateCareerSpecialCmsLinkAction = makeAction(
    careerOperations.updateSpecialCmsLink
)
