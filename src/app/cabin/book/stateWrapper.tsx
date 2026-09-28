'use client'
import CabinCalendar from './CabinCalendar'
import CabinPriceCalculator from './CabinPriceCalculator'
import SelectBedProducts from './SelectBedProduct'
import RadioLarge from '@/components/UI/RadioLarge'
import Form from '@/components/Form/Form'
import TextInput from '@/components/UI/TextInput'
import NumberInput from '@/components/UI/NumberInput'
import Checkbox from '@/components/UI/Checkbox'
import {
    createBedBookingNoUserAction,
    createBedBookingUserAttachedAction,
    createCabinBookingNoUserAction,
    createCabinBookingUserAttachedAction
} from '@/services/cabin/booking/actions'
import { getZodDateString } from '@/lib/dates/formatting'
import { configureAction } from '@/services/configureAction'
import { useSession } from '@/auth/session/useSession'
import { useMemo, useState } from 'react'
import type { CabinProductExtended } from '@/services/cabin/product/constants'
import type { BookingFiltered } from '@/services/cabin/booking/types'
import type { DateRange } from './CabinCalendar'
import type { BookingType, PricePeriod } from '@/prisma-generated-pn-types'

export default function StateWrapper({
    cabinAvailability,
    releaseUntil,
    cabinProducts,
    canBookCabin,
    canBookBed,
    pricePeriods,
}: {
    cabinAvailability: BookingFiltered[],
    releaseUntil: Date,
    cabinProducts: CabinProductExtended[],
    canBookCabin: boolean,
    canBookBed: boolean,
    pricePeriods: PricePeriod[]
}) {
    const bookingUntil = new Date()
    bookingUntil.setUTCMonth(bookingUntil.getUTCMonth() + 4)

    const cabinProduct = cabinProducts.find(product => product.type === 'CABIN')
    if (!cabinProduct) {
        throw new Error('No product with type CABIN.')
    }
    const bedProducts = cabinProducts.filter(product => product.type === 'BED')

    const [bookingType, setBookingType] = useState<BookingType>(canBookCabin ? 'CABIN' : 'BED')
    const [dateRange, setDateRange] = useState<DateRange>({})

    const [selectedProducts, setSelectedProducts] = useState<CabinProductExtended[]>(
        canBookCabin ? [cabinProduct] : bedProducts
    )
    const [bedAmounts, setBedAmounts] = useState<number[]>(Array(bedProducts.length).fill(0))

    const [numberOfMembers, setNumberOfMembers] = useState(0)
    const [numberOfNonMembers, setNumberOfNonMembers] = useState(0)

    const session = useSession()

    const calendar = useMemo(() => (
        <CabinCalendar
            startDate={new Date()}
            bookingUntil={releaseUntil}
            defaultDateRange={dateRange}
            intervalChangeCallback={setDateRange}
            bookings={cabinAvailability}
        />
    ), [cabinAvailability, releaseUntil, dateRange])

    const priceCalculator = useMemo(() => (
        <CabinPriceCalculator
            pricePeriods={pricePeriods}
            products={selectedProducts}
            productAmounts={bookingType === 'BED' ? bedAmounts : [1]}
            startDate={dateRange.start}
            endDate={dateRange.end}
            numberOfMembers={numberOfMembers}
            numberOfNonMembers={numberOfNonMembers}
        />
    ), [selectedProducts, bedAmounts, dateRange, numberOfMembers, numberOfNonMembers, bookingType, pricePeriods])

    if (!canBookCabin && !canBookBed) {
        return <>Du kan ikke booke hytta.</>
    }

    if (session.loading) {
        return <>Laster session...</>
    }

    const canChangeBookingType = canBookCabin && canBookBed

    const user = session.session.user

    function submitFormAction() {
        if (session.loading) {
            throw new Error('Session is still loading')
        }
        if (!cabinProduct) {
            throw new Error('Could not find the cabin product.')
        }

        if (!user) {
            if (bookingType === 'CABIN') {
                return configureAction(createCabinBookingNoUserAction, {
                    params: {
                        bookingProducts: [{
                            cabinProductId: cabinProduct.id,
                            quantity: 1,
                        }]
                    },
                })
            }

            return configureAction(createBedBookingNoUserAction, {
                params: {
                    bookingProducts: bedProducts.map((product, index) => ({
                        cabinProductId: product.id,
                        quantity: bedAmounts[index],
                    })).filter(product => product.quantity > 0)
                }
            })
        }

        if (bookingType === 'CABIN') {
            return configureAction(createCabinBookingUserAttachedAction, {
                params: {
                    userId: user?.id ?? -1,
                    bookingProducts: [{
                        cabinProductId: cabinProduct.id,
                        quantity: 1,
                    }]
                }
            })
        }

        return configureAction(createBedBookingUserAttachedAction, {
            params: {
                userId: user?.id ?? -1,
                bookingProducts: bedProducts.map((product, index) => ({
                    cabinProductId: product.id,
                    quantity: bedAmounts[index],
                })).filter(product => product.quantity > 0)
            }
        })
    }

    return <>
        {calendar}

        <Form
            action={submitFormAction()}
            submitText="Book hytta"
        >
            <input type="hidden" name="start" value={getZodDateString(dateRange.start) ?? ''} readOnly />
            <input type="hidden" name="end" value={getZodDateString(dateRange.end) ?? ''} readOnly />
            <input type="hidden" name="type" value={bookingType} readOnly />

            {canChangeBookingType &&
                <RadioLarge
                    name="Select type"
                    options={[
                        {
                            value: 'CABIN',
                            label: 'Hele hytta',
                        },
                        {
                            value: 'BED',
                            label: 'Enkelt seng'
                        }
                    ]}
                    value={bookingType}
                    onChange={(newType) => {
                        setBookingType(newType)
                        if (newType === 'CABIN') {
                            setSelectedProducts([cabinProduct])
                        } else {
                            setSelectedProducts(bedProducts)
                        }
                    }}
                />

            }

            {(bookingType === 'CABIN' && user) ? <>
                <NumberInput
                    name="numberOfMembers"
                    label="Antall som er medlem i Omega"
                    value={numberOfMembers}
                    onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value >= 0) {
                            setNumberOfMembers(value)
                        }
                    }}
                />
                <NumberInput
                    name="numberOfNonMembers"
                    label="Antall som ikke er medlem i Omega"
                    value={numberOfNonMembers}
                    onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value >= 0) {
                            setNumberOfNonMembers(value)
                        }
                    }}
                />
            </> : <>
                <input type="hidden" name="numberOfMembers" value={0} />
                <input type="hidden" name="numberOfNonMembers" value={0} />
            </>}

            {bookingType === 'BED' && <>
                <SelectBedProducts
                    amounts={bedAmounts}
                    bedProducts={bedProducts}
                    onChange={setBedAmounts}
                />
            </>}

            {priceCalculator}

            <TextInput
                name="firstname"
                label="Fornavn"
                defaultValue={user?.firstname ?? ''}
                disabled={Boolean(user)}
                readOnly={Boolean(user)}
            />
            <TextInput
                name="lastname"
                label="Etternavn"
                defaultValue={user?.lastname ?? ''}
                disabled={Boolean(user)}
                readOnly={Boolean(user)}
            />
            <TextInput
                name="email"
                label="E-post"
                defaultValue={user?.email ?? ''}
                disabled={Boolean(user)}
                readOnly={Boolean(user)}
            />
            <TextInput
                name="mobile"
                label="Telefonnummer"
                defaultValue={user?.mobile ?? ''}
                disabled={Boolean(user)}
                readOnly={Boolean(user)}
            />

            <TextInput name="tenantNotes" label="Notater til utleier" />

            <Checkbox name="acceptedTerms" label="Jeg godtar vilkårene under" />

        </Form>

    </>
}
