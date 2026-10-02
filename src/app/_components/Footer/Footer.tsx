import styles from './Footer.module.scss'
import FooterSponsors from './FooterSponsors'
import SocialIcons from '@/components/SocialIcons/SocialIcons'
import StandardImageServer from '@/components/Image/StandardImageServer'

async function Footer() {
    const emailDomain = process.env.EMAIL_DOMAIN

    return (
        <footer className={styles.Footer}>
            <div>
                <StandardImageServer
                    standardImage="LOGO_WHITE_TEXT"
                    width={350}
                    tint="var(--text)"
                    tintAspectRatio={1657.3333 / 210.66667}
                />
                <p>
                Linjeforeningen for Elektronisk Systemdesign
                og Innovasjon (MTELSYS) og Kybernetikk og
                Robotikk (MTTK) ved Norges Tekniske-Naturvitenskapelige Universitet (NTNU)
                </p>
                <p>Org. Nr. 890 384 692</p>
                <div>
                    {/* A PWA install badge belongs here: SpecialCmsImage FOOTER_1, width 200,
                        wrapping <Link className={styles.pwa} href="/infopages/pwa" />, fed by
                        readSpecialCmsImageFrontpage / updateSpecialCmsImageFrontpage and a
                        canEdit from frontpageAuth.updateSpecialCmsImage. It was commented out
                        waiting for the PWA icon to exist as an SVG, and the imports and the
                        canEdit prop went with the hardcoded sponsor slots when this footer moved
                        onto the company sponsor tiers. Restore both when the icon is ready. */}
                    <div className={styles.icons}>
                        <SocialIcons />
                    </div>
                </div>
            </div>
            <div className={styles.infoGroup}>
                <div className={styles.info}>
                    <p>Kontakt:</p>
                    <p>Bedrift: <a href="mailto:post@contactor.no">post@contactor.no</a></p>
                    <p>Teknisk: <a href={`mailto:vevcom@${emailDomain}`}>vevcom@{emailDomain}</a></p>
                    <p>PR: <a href={`mailto:blaest@${emailDomain}`}>blaest@{emailDomain}</a></p>
                    <p>Annet: <a href={`mailto:hs@${emailDomain}`}>hs@{emailDomain}</a></p>
                    <p>Tlf: <a href="tel:73594211">73 59 42 11</a></p>
                </div>
                <div className={styles.info}>
                    <p>Adresse:</p>
                    <p>Sct.Omega Broderskab</p>
                    <p>NTNU Gløshaugen</p>
                    <p>Elektro-bygget</p>
                    <p>7491 Trondheim</p>
                </div>
            </div>
            <div className={styles.sponsors}>
                <FooterSponsors />
            </div>
        </footer>
    )
}

export default Footer
