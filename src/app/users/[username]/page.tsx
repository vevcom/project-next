import styles from './page.module.scss'
import { ClassLevelConfig } from '@/services/groups/constants'
import Button from '@/components/UI/Button'
import ProfilePicture from '@/components/User/ProfilePicture'
import UserDisplayName from '@/components/User/UserDisplayName'
import { readUserProfileAction } from '@/services/users/actions'
import { ServerSession } from '@/auth/session/ServerSession'
import { flairAuth } from '@/services/flairs/auth'
import { sexConfig } from '@/services/users/constants'
import { readUserFlairsAction } from '@/services/flairs/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { RelationshipStatus } from '@/prisma-generated-pn-types'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import UserAdminNavBar from '@/app/users/[username]/UserAdminNavBar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMoneyBill,
    faQrcode,
    faSignOut,
} from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Profil',
}


export type PropTypes = {
    params: Promise<{
        username: string
    }>,
}

export default async function User({ params }: PropTypes) {
    const session = await ServerSession.fromNextAuth()
    if ((await params).username === 'me') {
        if (!session.user) redirect('/login')
        redirect(`/users/${session.user.username}`) //This throws.
    }
    const profileRes = await readUserProfileAction({ params: { username: (await params).username } })
    if (!profileRes.success) return notFound()
    const profile = profileRes.data

    const committeeMemberships = profile.user.memberships.filter(membership => membership.group.groupType === 'COMMITTEE')
        .filter(membership => membership.group.committee !== null)

    const studyProgrammes = profile.user.memberships.filter(membership => membership.group.groupType === 'STUDY_PROGRAMME')
        .map(membership => membership.group.studyProgramme).filter(membership => membership !== null)

    const classes = profile.user.memberships.filter(membership => membership.group.groupType === 'CLASS')
        .map(membership => membership.group.class).filter(membership => membership !== null)

    const omegaMembership = profile.user.memberships
        .find(membership => membership.group.groupType === 'OMEGA_MEMBERSHIP_GROUP')
    if (!omegaMembership) {
        throw new Error('Failed to load the omega membership level')
    }
    const flairs = unwrapActionReturn(await readUserFlairsAction({ params: { userId: profile.user.id } })).sort(
        (a, b) => a.rank - b.rank
    )

    const relationshipColour = {
        [RelationshipStatus.SINGLE]: 'green',
        [RelationshipStatus.ITS_COMPLICATED]: 'yellow',
        [RelationshipStatus.TAKEN]: 'red',
        [RelationshipStatus.NOT_SPECIFIED]: 'white'
    }

    const borderColour = { '--border-colour': relationshipColour[profile.user.relationshipStatus] } as React.CSSProperties
    const flairColour = {
        '--flairColor': flairs.length > 0
            ? `rgb(${flairs[0].colorR}, ${flairs[0].colorG}, ${flairs[0].colorB})`
            : 'transparent'
    } as React.CSSProperties
    const isOwnProfile = profile.user.id === session.user?.id
    const canAssignFlairs = flairAuth.assignToUser.dynamicFields({}).auth(session)

    function memberhipTitle(): string {
        switch (omegaMembership?.group.omegaMembershipGroup?.omegaMembershipLevel) {
            case 'SOELLE':
                return 'Soelle Noviice (avsky!)'
            case 'MEMBER':
                return `
                    ${sexConfig[profile.user.sex ?? 'OTHER'].title}
                    uudaf ${omegaMembership.order}´dis orden i Sanctus Omega Broderskab
                `
            case 'EXTERNAL':
                return 'Ekstern'
            default:
        }
        return 'Kunne ikke finne tittel'
    }

    return (
        <div className={styles.wrapper}>
            <PageTitleSetter title={'Profil'} />
            <div className={styles.profile}>
                <div className={styles.profileContent} style={{ ...borderColour, ...flairColour }}>
                    <div className={styles.profileContentInner}>
                        <ProfilePicture width={240} profileImage={profile.user.image} className={styles.profilePicture}/>
                        <div className={styles.header}>
                            <div className={styles.nameAndId}>
                                <h1><UserDisplayName
                                    user={profile.user}
                                    width={40}
                                /></h1>
                            </div>
                            {studyProgrammes.map((studyProgramme, i) =>
                                <p key={i} className={styles.studyProgramme}>
                                    {studyProgramme.name} {`(${studyProgramme.code})`}
                                </p>
                            )}
                            {classes.map((classGroup, i) =>
                                <p key={i} className={styles.studyProgramme}>{ClassLevelConfig[classGroup.level].name}</p>
                            )}
                            <div className={styles.committeesWrapper}>
                                {
                                    committeeMemberships.filter(membership => membership.active).map(membership =>
                                        <div className={styles.committee} key={uuid()}>
                                            <Link href={`/committees/${membership.group.committee?.shortName}`}>
                                                <p>{membership.title}</p>
                                            </Link>
                                        </div>
                                    )
                                }
                                {/* TODO change to your own committee title instead of committee name*/}
                            </div>
                            <hr />
                            <p className={styles.orderText}>
                                { memberhipTitle() }
                            </p>
                        </div>
                        <div className={styles.leftSection}>
                            <div className={styles.buttons}>
                                {isOwnProfile && (
                                    <>
                                        <Link href="/users/me/omegaid">
                                            <Button color="secondary" className={styles.actionButton}>
                                                <FontAwesomeIcon icon={faQrcode} />
                                                <p>Omega-ID</p>
                                            </Button>
                                        </Link>
                                        <Link href="/users/me/account">
                                            <Button color="secondary" className={styles.actionButton}>
                                                <FontAwesomeIcon icon={faMoneyBill} />
                                                <p>Konto</p>
                                            </Button>
                                        </Link>
                                        <Link href="/logout">
                                            <Button color="secondary" className={styles.actionButton}>
                                                <FontAwesomeIcon icon={faSignOut} />
                                                <p>Logg ut</p>
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>

                        </div>
                        <div className={styles.profileMain}>


                            {(profile.user.bio !== '') &&
                                <div className={styles.bio}>
                                    <h2>Bio:</h2>
                                    <p>{profile.user.bio}</p>
                                </div>
                            }

                            {(profile.user.relationshipStatus !== RelationshipStatus.NOT_SPECIFIED) &&
                            <p>
                                <span className={styles.relationshipStatus}>Sivilstatus: </span>
                                {profile.user.relationshipStatusText ? profile.user.relationshipStatusText :
                                    profile.user.relationshipStatus === RelationshipStatus.SINGLE && 'Singel' ||
                                    profile.user.relationshipStatus === RelationshipStatus.ITS_COMPLICATED
                                        && 'Det er komplisert' ||
                                    profile.user.relationshipStatus === RelationshipStatus.TAKEN && 'I et forhold'
                                }

                            </p>
                            }


                            <p>
                                <span className={styles.email}>E-post:</span>
                                {profile.user.email}
                            </p>
                            <p>
                                <span className={styles.username}>Brukernavn:</span>
                                {profile.user.username}
                            </p>
                            <p>
                                <span className={styles.username}>Mobilnummer:</span>
                                {profile.user.mobile}
                            </p>

                            {(committeeMemberships.length > 0) && <div>
                                <h2>Medlemsskap</h2>
                                {committeeMemberships.map((membership, i) => (
                                    <Link
                                        className={styles.memberShipInCommitteeLink}
                                        href={`/committees/${membership.group.committee?.shortName}`}
                                        key={i}
                                    >
                                        <p className={styles.memberShipInCommittee}>
                                            {membership.title} i {membership.group.committee?.name}
                                        </p>
                                    </Link>
                                ))}
                            </div>}
                        </div>
                    </div>
                </div>

                {isOwnProfile && (
                    <UserAdminNavBar
                        username={profile.user.username}
                        canAssignFlairs={canAssignFlairs.authorized}
                    />
                )}
            </div>
        </div>
    )
}
