import styles from './page.module.scss'
import ChangeName from './ChangeName'
import OmbulAdmin from './OmbulAdmin'
import { readOmbulAction, updateOmbulParagraphContentAction } from '@/services/ombul/actions'
import PdfDocument from '@/components/PdfDocument/PdfDocument'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import CmsParagraph from '@/components/Cms/CmsParagraph/CmsParagraph'
import Image from '@/components/Image/Image'
import PopUp from '@/components/PopUp/PopUp'
import { ServerSession } from '@/auth/session/ServerSession'
import { configureAction } from '@/services/configureAction'
import { ombulAuth } from '@/services/ombul/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type PropTypes = {
    params: Promise<{
        yearAndName: string[]
    }>
}

export default async function Ombul({ params }: PropTypes) {
    const year = parseInt(decodeURIComponent((await params).yearAndName[0]), 10)
    const name = decodeURIComponent((await params).yearAndName[1])
    if (!year || !name || (await params).yearAndName.length > 2) notFound()
    const ombulRes = await readOmbulAction({
        params: {
            name,
            year
        }
    })
    if (!ombulRes.success) notFound()
    const ombul = ombulRes.data

    const path = `/store/ombul/${ombul.fsLocation}`

    const session = await ServerSession.fromNextAuth()
    const canUpdate = ombulAuth.update.auth(session)
    const canUpdateParagraph = ombulAuth.updateParagraphContent.auth(session).toJsObject()

    return (
        <PageWrapper title={ombul.name} hideTitle className={styles.ombulPage}>
            <div className={styles.header}>
                <div className={styles.titleBlock}>
                    <ChangeName editable={canUpdate.authorized} ombulId={ombul.id}>
                        <h1>{ombul.name}</h1>
                    </ChangeName>
                    <p className={styles.issue}>{ombul.year} &middot; utgave {ombul.issueNumber}</p>
                    {ombul.description && <p className={styles.description}>{ombul.description}</p>}
                </div>
                {/* Beside the title rather than in the wrapper's header slot, which sits above it -
                    the actions would otherwise be read before the issue they act on. */}
                <div className={styles.actions}>
                    <a className={styles.download} href={path} download>Last ned</a>
                    <Link className={styles.secondaryAction} href={path} target="blank">Åpne i ny fane</Link>
                    <PopUp
                        popUpKey={`OmbulPdfViewer${ombul.id}`}
                        showButtonClass={styles.secondaryAction}
                        showButtonContent="Les PDF"
                    >
                        <PdfDocument src={path} className={styles.book} />
                    </PopUp>
                </div>
            </div>

            <div className={styles.coverAndParagraph}>
                {/* The cover itself rather than an OmbulCover card: on this page that card linked
                    back to the page you are already on and repeated the name and issue printed
                    right above it. */}
                <div className={styles.cover}>
                    <Image image={ombul.coverImage} width={260} />
                </div>
                <CmsParagraph
                    className={styles.paragraph}
                    canEdit={canUpdateParagraph}
                    cmsParagraph={ombul.paragraph}
                    updateCmsParagraphAction={configureAction(
                        updateOmbulParagraphContentAction,
                        { implementationParams: { ombulId: ombul.id } }
                    )}
                />
            </div>

            <OmbulAdmin ombul={ombul} />
        </PageWrapper>
    )
}
