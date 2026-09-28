import { readCabinBookingAction } from '@/services/cabin/booking/actions'
import PageWrapper from '@/app/_components/PageWrapper/PageWrapper'
import SimpleTable from '@/app/_components/Table/SimpleTable'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { displayDate } from '@/lib/dates/displayDate'
import { formatVevenUri } from '@/lib/urlEncoding'
import Link from 'next/link'
import React from 'react'

function trHelper(key: string, value: React.ReactNode) {
    return <tr>
        <th>{key}</th>
        <td>{value}</td>
    </tr>
}

export default async function CabinBooking({
    params
}: {
    params: Promise<{
        booking: string,
    }>
}) {
    const booking = unwrapActionReturn(await readCabinBookingAction({
        params: {
            id: parseInt(decodeURIComponent((await params).booking), 10)
        }
    }))

    return <PageWrapper
        title="Booking"
    >

        <table>
            <tbody>
                {trHelper('ID', booking.id)}
                {trHelper('Start', displayDate(booking.start, false))}
                {trHelper('Slutt', displayDate(booking.end, false))}
                {trHelper('Antall medlemmer', booking.numberOfMembers)}
                {trHelper('Antall eksterne', booking.numberOfNonMembers)}
                {trHelper('Interne notater', booking.notes)}
                {trHelper('Notater fra leietaker', booking.tenantNotes)}
                {trHelper('Type', booking.type)}
                {booking.user &&
                    trHelper('Leietaker', <Link
                        href={`/users/${booking.user.username}`}
                    >
                        {booking.user.firstname} {booking.user.lastname}
                    </Link>)
                }
                {booking.event &&
                    trHelper('Arrangement', <Link
                        href={`/event/${formatVevenUri(booking.event.name, booking.event.id)}`}
                    >
                        {booking.event.name}
                    </Link>)
                }
                {booking.guestUser && <>
                    { trHelper('Gjest', `${booking.guestUser.firstname} ${booking.guestUser.lastname}`) }
                    { trHelper('E-post', booking.guestUser.email) }
                    { trHelper('Telefonnummer', booking.guestUser.mobile) }
                </>}
            </tbody>
        </table>

        <SimpleTable
            header={[
                'Produkt',
                'Antall'
            ]}
            body={booking.BookingProduct.map(product => [
                product.product.name,
                product.quantity
            ])}
        />
    </PageWrapper>
}
