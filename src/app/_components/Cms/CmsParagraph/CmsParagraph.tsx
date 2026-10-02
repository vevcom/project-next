import styles from './CmsParagraph.module.scss'
import ParagraphEditor from './CmsParagraphEditor'
import { sanitizeHtml } from '@/lib/html/sanitizeHtml'
import React from 'react'
import type { CmsParagraph as CmsParagraphT } from '@/prisma-generated-pn-types'
import type { UpdateCmsParagraphAction } from '@/cms/paragraphs/types'
import type { AuthResultTypeAny } from '@/auth/authorizer/AuthResult'

export type PropTypes = {
    cmsParagraph: CmsParagraphT
    className?: string
    updateCmsParagraphAction: UpdateCmsParagraphAction
    canEdit: AuthResultTypeAny
}

export default function CmsParagraph({ cmsParagraph, className, updateCmsParagraphAction, canEdit }: PropTypes) {
    return (
        <>
            <div className={`${styles.CmsParagraph} ${className}`}>
                {cmsParagraph.contentHtml ? (
                    <div
                        className={styles.HTMLcontent}
                        // Sanitized again on the way out, not only when written: rows written before
                        // html imported by DobbelOmega, never passed through it.
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(cmsParagraph.contentHtml) }}
                    />
                ) : (
                    <i>Her var det ikke noe innhold</i>
                )}
                <ParagraphEditor
                    canEdit={canEdit}
                    cmsParagraph={cmsParagraph}
                    updateCmsParagraphAction={updateCmsParagraphAction}
                />
            </div>
        </>
    )
}
