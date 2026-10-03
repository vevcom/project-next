import StateWrapper from './stateWrapper'
import SpecialCmsParagraph from '@/app/_components/Cms/CmsParagraph/SpecialCmsParagraph'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { default as DateComponent } from '@/components/Date/Date'
import {
    readCabinAvailabilityAction,
    readSpecialCmsParagraphCabinContractAction,
    updateSpecialCmsParagraphCabinContractAction
} from '@/services/cabin/booking/actions'
import { readCabinProductsActiveAction } from '@/services/cabin/product/actions'
import { readPublicPricePeriodsAction } from '@/services/cabin/pricePeriod/actions'
import { readReleasePeriodsAction } from '@/services/cabin/releasePeriod/actions'
import { calculateLedgerAccountBalanceAction } from '@/services/ledger/accounts/actions'
import { createStripeCustomerSessionAction } from '@/services/stripeCustomers/actions'
import { ServerSession } from '@/auth/session/ServerSession'
import { displayDate } from '@/lib/dates/displayDate'
import { cabinBookingAuth } from '@/services/cabin/booking/auth'
import type { ReleasePeriod } from '@/prisma-generated-pn-types'

function findCurrentReleasePeriod(releasePeriods: ReleasePeriod[]) {
    const filtered = releasePeriods.filter(releasePeriod => {
        const now = new Date()
        return releasePeriod.releaseTime < now && now < releasePeriod.releaseUntil
    })

    if (filtered.length === 0) return new Date()
    return filtered[0].releaseUntil
}

function findNextReleasePeriod(releasePeriods: ReleasePeriod[]) {
    const filtered = releasePeriods.filter(releasePeriod => {
        const now = new Date()
        return now < releasePeriod.releaseTime
    })

    if (filtered.length === 0) return null
    return filtered[0]
}

export default async function CabinBooking() {
    const cabinAvailability = unwrapActionReturn(await readCabinAvailabilityAction())
    const releasePeriods = unwrapActionReturn(await readReleasePeriodsAction())
    const releaseUntil = findCurrentReleasePeriod(releasePeriods)
    const nextReleasePeriod = findNextReleasePeriod(releasePeriods)
    const pricePeriods = unwrapActionReturn(await readPublicPricePeriodsAction())
    const cabinProducts = unwrapActionReturn(await readCabinProductsActiveAction())

    const session = await ServerSession.fromNextAuth()
    const canBookCabin = cabinBookingAuth.createCabinBookingNoUser.auth(session)
    const canBookBed = cabinBookingAuth.createBedBookingNoUser.auth(session)
    const canEditSpecialCmsParagraphContract = cabinBookingAuth.updateSpecialCmsParagraphContentCabinContract.auth(
        session
    ).toJsObject()

    let cabinBookingBalance: number | undefined
    let cabinBookingCustomerSessionSecret: string | undefined

    if (session.user) {
        cabinBookingBalance = unwrapActionReturn(
            await calculateLedgerAccountBalanceAction({ params: { userId: session.user.id } })
        ).amount

        const customerSessionResult = await createStripeCustomerSessionAction({
            params: { userId: session.user.id }
        })
        cabinBookingCustomerSessionSecret = customerSessionResult.success
            ? customerSessionResult.data.customerSessionClientSecret
            : undefined
    }

    return <PageWrapper
        title="Hyttebooking"
    >
        {nextReleasePeriod &&
            <p>
                Neste slipptid er <DateComponent date={nextReleasePeriod.releaseTime} />,
                da slippes bookinger fram til <DateComponent date={nextReleasePeriod.releaseUntil} />
            </p>
        }
        {pricePeriods.length > 1 &&
            <p>
                Nye priser fra: {pricePeriods.slice(1).map(period => displayDate(period.validFrom, false)).join(', ')}
            </p>
        }
        <StateWrapper
            cabinAvailability={cabinAvailability}
            releaseUntil={releaseUntil}
            cabinProducts={cabinProducts}
            canBookCabin={canBookCabin.authorized}
            canBookBed={canBookBed.authorized}
            pricePeriods={pricePeriods}
            availableBalance={cabinBookingBalance}
            customerSessionClientSecret={cabinBookingCustomerSessionSecret}
        />

        <SpecialCmsParagraph
            canEdit={canEditSpecialCmsParagraphContract}
            special="CABIN_CONTRACT"
            readSpecialCmsParagraphAction={readSpecialCmsParagraphCabinContractAction}
            updateCmsParagraphAction={updateSpecialCmsParagraphCabinContractAction}
        />
    </PageWrapper>
}
