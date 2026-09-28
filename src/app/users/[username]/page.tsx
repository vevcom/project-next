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

    // Which study programmes someone is on is a statement about now, so only the active ones.
    const studyProgrammes = profile.user.memberships
        .filter(membership => membership.group.groupType === 'STUDY_PROGRAMME' && membership.active)
        .map(membership => membership.group.studyProgramme).filter(membership => membership !== null)

    const interestGroupMemberships = profile.user.memberships
        .filter(membership => membership.group.groupType === 'INTEREST_GROUP')
        .filter(membership => membership.group.interestGroup !== null)

    // Newest order first: the history reads from the most recent membership downwards.
    const byOrderDescending = <T extends { order: number }>(memberships: T[]) => [...memberships]
        .sort((membershipOne, membershipTwo) => membershipTwo.order - membershipOne.order)

    const committeeMembershipsByOrder = byOrderDescending(committeeMemberships)
    const interestGroupMembershipsByOrder = byOrderDescending(interestGroupMemberships)
    const activeCommitteeMemberships = committeeMemberships.filter(membership => membership.active)

    const omegaMembership = byOrderDescending(profile.user.memberships
        .filter(membership => membership.group.groupType === 'OMEGA_MEMBERSHIP_GROUP' && membership.active))[0]
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
                            <p className={styles.orderText}>
                                { memberhipTitle() }
                            </p>

                            <div className={styles.committeesWrapper}>
                                {activeCommitteeMemberships.map(membership =>
                                    <div className={styles.committee} key={uuid()}>
                                        <Link href={`/committees/${membership.group.committee?.shortName}`}>
                                            <p>{membership.title} i {membership.group.committee?.name}</p>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <hr />

                            {committeeMembershipsByOrder.length > 0 && (
                                <section className={styles.groupSection}>
                                    <h2>Komitéer:</h2>
                                    {committeeMembershipsByOrder.map(membership =>
                                        <Link
                                            key={uuid()}
                                            href={`/committees/${membership.group.committee?.shortName}`}
                                        >
                                            <p className={styles.studyProgramme}>
                                                {membership.title} udaf {membership.order}´dis orden i{' '}
                                                {membership.group.committee?.name}
                                            </p>
                                        </Link>
                                    )}
                                </section>
                            )}

                            {interestGroupMembershipsByOrder.length > 0 && (
                                <section className={styles.groupSection}>
                                    <h2>Interessegrupper:</h2>
                                    {interestGroupMembershipsByOrder.map(membership =>
                                        <Link
                                            key={uuid()}
                                            href={`/interest-groups/${membership.group.interestGroup?.id}`}
                                        >
                                            <p className={styles.studyProgramme}>
                                                {membership.title} udaf {membership.order}´dis orden i{' '}
                                                {membership.group.interestGroup?.name}
                                            </p>
                                        </Link>
                                    )}
                                </section>
                            )}

                            {studyProgrammes.length > 0 && (
                                <section className={styles.groupSection}>
                                    <h2>Studier:</h2>
                                    {studyProgrammes.map(studyProgramme =>
                                        <p key={studyProgramme.id} className={styles.studyProgramme}>
                                            {studyProgramme.name} {`(${studyProgramme.code})`}
                                        </p>
                                    )}
                                </section>
                            )}
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
                            <p>
                                <span className={styles.username}>Klasse:</span>
                                {profile.class ? ClassLevelConfig[profile.class.level].name : 'Ingen klasse'}
                            </p>
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
