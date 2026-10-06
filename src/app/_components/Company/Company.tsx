import styles from './Company.module.scss'
import SelectCompany from './SelectCompany'
import SponsorBadge from './SponsorBadge'
import CompanySponsorTierForm from './CompanySponsorTierForm'
import { SettingsHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import TextInput from '@/UI/TextInput'
import CmsImage from '@/cms/CmsImage/CmsImage'
import Form from '@/components/Form/Form'
import { companyAuth } from '@/services/career/companies/auth'
import {
    destroyCompanyAction,
    updateCompanyAction,
    updateCompanyCmsLogoAction
} from '@/services/career/companies/actions'
import { configureAction } from '@/services/configureAction'
import type { CompanyExpanded } from '@/services/career/companies/types'
import type { SessionMaybeUser } from '@/auth/session/Session'

type PropTypes = {
    company: CompanyExpanded,
    session: SessionMaybeUser,
    disableEdit?: boolean,
    logoWidth?: number,
    squareLogo?: boolean
}

/**
 *
 * @param company - The company to display
 * @param session - The session of the user
 * @param disableEdit - If the edit buttons should be disabled even if the user has the rights
 * @param logoWidth - The width of the logo
 * @param squareLogo - If the logo should be square (contained in center of square frame)
 * @returns
 */
export default function Company({
    company,
    session,
    disableEdit = false,
    logoWidth = 300,
    squareLogo = true,
}: PropTypes) {
    const canUpdate = companyAuth.update.auth(session)
    const canUpdateSponsorTier = companyAuth.updateSponsorTier.auth(session)
    const canDestroy = companyAuth.destroy.auth(session)
    const canEditCmsImageLogo = companyAuth.updateCmsImageLogo.auth(session).toJsObject()
    const updateCmsImageAction = configureAction(
        updateCompanyCmsLogoAction,
        { implementationParams: { companyId: company.id } }
    )
    const showSettings = !disableEdit && (
        canUpdate.authorized || canUpdateSponsorTier.authorized || canDestroy.authorized
    )
    return (
        <div className={`${styles.Company} ${styles[company.sponsorTier] ?? ''}`}>
            <div className={styles.logoFrame}>
                <CmsImage
                    canEdit={canEditCmsImageLogo}
                    disableEditor={disableEdit}
                    className={squareLogo ? styles.logoSq : styles.logo}
                    cmsImage={company.logo}
                    width={logoWidth}
                    updateCmsImageAction={updateCmsImageAction}
                />
                <SponsorBadge sponsorTier={company.sponsorTier} iconOnly className={styles.badge} />
            </div>
            <div className={`${styles.info} ${showSettings ? styles.withSettings : ''}`}>
                <h2>{company.name}</h2>
                <p>{company.description}</p>
                {
                    showSettings ? (
                        <SettingsHeaderItemPopUp showButtonClass={styles.showSettings} popUpKey={`Edit ${company.id}`}>
                            <Form
                                title="Rediger bedrift"
                                action={configureAction(updateCompanyAction, { params: { id: company.id } })}
                                refreshOnSuccess
                                closePopUpOnSuccess={`Edit ${company.id}`}
                                submitText="Lagre"
                            >
                                <TextInput name="name" label="Navn" defaultValue={company.name} />
                                <TextInput name="description" label="Beskrivelse" defaultValue={company.description} />
                                <TextInput
                                    name="website"
                                    label="Nettside"
                                    defaultValue={company.website ?? ''}
                                />
                            </Form>
                            {
                                canUpdateSponsorTier.authorized && <CompanySponsorTierForm
                                    companyId={company.id}
                                    sponsorTier={company.sponsorTier}
                                    closePopUpOnSuccess={`Edit ${company.id}`}
                                />
                            }
                            <Form
                                action={configureAction(destroyCompanyAction, { params: { id: company.id } })}
                                refreshOnSuccess
                                closePopUpOnSuccess={`Edit ${company.id}`}
                                submitText="Slett"
                                submitColor="red"
                                confirmation={{
                                    confirm: true,
                                    text: 'Er du sikker på at du vil slette denne bedriften?'
                                }}
                            />
                        </SettingsHeaderItemPopUp>
                    ) : <></>
                }
            </div>
            <SelectCompany company={company} />
        </div>
    )
}
