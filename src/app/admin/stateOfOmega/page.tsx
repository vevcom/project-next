import styles from './page.module.scss'
import CreateOrder from './CreateOrder'
import Requirements from './Requirements'
import { readCurrentOmegaOrderAction, readOmegaOrderRequirementsAction } from '@/services/omegaOrder/actions'
import { omegaOrderAuth } from '@/services/omegaOrder/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import Date from '@/components/Date/Date'
import PageTitleSetter from '@/contexts/PageTitleSetter'

export default async function stateOfOmega() {
    omegaOrderAuth.create.dynamicFields({}).auth(
        await ServerSession.fromNextAuth()
    ).redirectOnUnauthorized({ returnUrl: '/admin/stateOfOmega' })

    const currentOrder = unwrapActionReturn(await readCurrentOmegaOrderAction())
    const requirements = unwrapActionReturn(await readOmegaOrderRequirementsAction())

    const allRequirementsFulfilled = requirements.every(requirement => requirement.fulfilled)

    return (
        <div className={styles.wrapper}>
            <PageTitleSetter title={'Omegas tilstand'} />
            <div className={styles.plaque}>
                <p className={styles.label}>Omega er i orden</p>
                <h1 className={styles.order}>{ currentOrder.order }</h1>
            </div>
            <p className={styles.lastIncremented}>
                Ordenen til Omega ble sist inkrementert <Date date={currentOrder.createdAt} includeTime={false} />
            </p>
            <div className={styles.requirements}>
                <Requirements requirements={requirements} />
            </div>
            <CreateOrder allRequirementsFulfilled={allRequirementsFulfilled} />
        </div>
    )
}
