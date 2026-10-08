import styles from './Section.module.scss'
import SpecialCmsParagraph from '@/components/Cms/CmsParagraph/SpecialCmsParagraph'
import SpecialCmsImage from '@/components/Cms/CmsImage/SpecialCmsImage'
import {
    readSpecialCmsImageFrontpage,
    readSpecialCmsParagraphFrontpageSection,
    updateSpecialCmsImageFrontpage,
    updateSpecialCmsParagraphFrontpageSection
} from '@/services/frontpage/actions'
import Link from 'next/link'
import type {
    SpecialCmsImage as SpecialCmsImageT,
    SpecialCmsParagraph as SpecialCmsParagraphT
} from '@/prisma-generated-pn-types'
import type { AuthResultAny } from '@/auth/authorizer/AuthResult'
import type { ReactNode } from 'react'

type PropTypes = {
    specialCmsImage: SpecialCmsImageT,
    canEditSpecialCmsImage: AuthResultAny,
    specialCmsParagraph: SpecialCmsParagraphT,
    canEditSpecialCmsParagraph: AuthResultAny,
    readMore: string,
    position: 'left' | 'right',
    imgWidth: number,
    id?: string,
    children?: ReactNode,
}

function Section({
    specialCmsImage,
    canEditSpecialCmsImage,
    specialCmsParagraph,
    canEditSpecialCmsParagraph,
    readMore,
    position,
    imgWidth,
    id,
    children
}: PropTypes) {
    const imgContainer = (
        <div style={{ width: imgWidth }} className={styles.imgContainer}>
            <SpecialCmsImage
                capabilities={{ canEdit: canEditSpecialCmsImage }}
                special={specialCmsImage}
                width={imgWidth}
                readSpecialCmsImageAction={readSpecialCmsImageFrontpage}
                updateCmsImageAction={updateSpecialCmsImageFrontpage}
            />
        </div>
    )
    return (
        <div id={id} className={`${styles.section} ${position === 'right' && styles.blue}`}>
            {position === 'left' && imgContainer}
            <div>
                <SpecialCmsParagraph
                    capabilities={{ canEdit: canEditSpecialCmsParagraph }}
                    className={styles.paragraph}
                    special={specialCmsParagraph}
                    readSpecialCmsParagraphAction={readSpecialCmsParagraphFrontpageSection}
                    updateCmsParagraphAction={updateSpecialCmsParagraphFrontpageSection}
                />
                <Link className={styles.readMore} href={readMore}>Les mer</Link>
                {children}
            </div>
            {position === 'right' && imgContainer}
        </div>
    )
}

export default Section
