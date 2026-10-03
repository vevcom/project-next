import styles from './page.module.scss'
import { getProfileForUserPage } from '@/app/users/[username]/(user-pages)/getProfileForUserPage'
import { readAdmissionTrialsAction, createAdmissionTrialAction } from '@/services/admission/actions'
import {
    updateOmegaMembershipUserLevelAction,
    updateOmegaMembershipUserOrderAction,
} from '@/services/groups/omegaMembershipGroups/actions'
import { admissionAuth } from '@/services/admission/auth'
import { omegaMembershipGroupAuth } from '@/services/groups/omegaMembershipGroups/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { admissionDisplayNames, allAdmissions } from '@/services/admission/constants'
import { OMEGA_MEMBERSHIP_LEVEL_RANKING } from '@/services/groups/constants'
import { sexConfig } from '@/services/users/constants'
import { configureAction } from '@/services/configureAction'
import Form from '@/components/Form/Form'
import NumberInput from '@/components/UI/NumberInput'
import type { OmegaMembershipLevel } from '@/prisma-generated-pn-types'
import type { PropTypes } from '@/app/users/[username]/page'

/**
 * What each step of the ladder is called on this page. Sysken is left out: what a member is called
 * depends on who they are, so it is resolved against the user's sex below.
 */
const stepNames = {
    DEN_GEMENE_HOB: 'Den gemene hob',
    SOELLE: 'Soelle',
} as const satisfies Partial<Record<OmegaMembershipLevel, string>>

export default async function MembershipStatus({ params }: PropTypes) {
    const { profile, session } = await getProfileForUserPage(await params, 'membership-status')
    const { id: userId } = profile.user

    const canReadTrials = admissionAuth.readTrial.data({ userId }).auth(session).authorized
    const canRegisterTrial = admissionAuth.createTrial.auth(session).authorized
    const canChangeLevel = omegaMembershipGroupAuth.updateUserLevel.auth(session).authorized
    const canChangeOrder = omegaMembershipGroupAuth.updateUserOrder.auth(session).authorized

    const currentLevel = profile.omegaMembership.level
    const sittedTrials = new Set(canReadTrials
        ? unwrapActionReturn(await readAdmissionTrialsAction({ params: { userId } })).map(trial => trial.admission)
        : [])

    // Only a soelle sits trials, so that is the only time registering one would be accepted.
    const showTrialRegistration = canRegisterTrial && currentLevel === 'SOELLE'

    return (
        <div className={styles.wrapper}>
            <h2>Medlemsstatus</h2>

            {/* Highest standing first, so the ladder is read from the top down. */}
            <ol className={styles.ladder}>
                {[...OMEGA_MEMBERSHIP_LEVEL_RANKING].reverse().map(level => (
                    <li key={level} className={styles.step}>
                        <div className={level === currentLevel
                            ? `${styles.level} ${styles.current}`
                            : styles.level}
                        >
                            <span>
                                {level === 'SYSKEN'
                                    ? sexConfig[profile.user.sex ?? 'OTHER'].title
                                    : stepNames[level]}
                            </span>
                            {level === currentLevel
                                ? <span className={styles.marker}>Du er her</span>
                                : canChangeLevel && (
                                    <Form
                                        className={styles.action}
                                        submitText="Flytt hit"
                                        submitColor="secondary"
                                        refreshOnSuccess
                                        confirmation={{
                                            confirm: true,
                                            text: 'Er du sikker? Opptaksprøver nullstilles om brukeren flyttes ned.',
                                        }}
                                        action={configureAction(updateOmegaMembershipUserLevelAction, {
                                            params: { userId, omegaMembershipLevel: level, onlyUpgrade: false },
                                        })}
                                    />
                                )}
                        </div>

                        {/* The trials are what carries a soelle up to sysken, so they sit in the
                            gap between the two. Hidden from anyone who may not read them, since
                            empty boxes would read as "none sat" rather than "not shown". */}
                        {level === 'SYSKEN' && canReadTrials && (
                            <ul className={styles.trials}>
                                {allAdmissions.map(admission => (
                                    <li
                                        key={admission}
                                        className={sittedTrials.has(admission)
                                            ? `${styles.trial} ${styles.sitted}`
                                            : styles.trial}
                                    >
                                        <span>{admissionDisplayNames[admission]}</span>
                                        {showTrialRegistration && !sittedTrials.has(admission) && (
                                            <Form
                                                className={styles.action}
                                                submitText="Registrer"
                                                submitColor="secondary"
                                                refreshOnSuccess
                                                action={configureAction(createAdmissionTrialAction, {
                                                    params: { admission },
                                                })}
                                            >
                                                <input type="hidden" name="userId" value={userId} />
                                            </Form>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ol>

            <section className={styles.order}>
                <h3>Orden</h3>
                <p>
                    Medlemskapet er udaf den {profile.omegaMembership.order}´dis orden.
                </p>
                {canChangeOrder && (
                    <Form
                        submitText="Endre orden"
                        refreshOnSuccess
                        action={configureAction(updateOmegaMembershipUserOrderAction, {
                            params: { userId },
                        })}
                    >
                        <NumberInput
                            name="order"
                            label="Orden"
                            defaultValue={profile.omegaMembership.order}
                            min={1}
                        />
                    </Form>
                )}
            </section>
        </div>
    )
}
