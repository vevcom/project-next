'use client'

import TextInput from '@/components/UI/TextInput'
import Form from '@/components/Form/Form'
import { SelectNumber } from '@/components/UI/Select'
import { createMailingListExternalRelationAction } from '@/services/mail/actions'
import {
    updateMailAddressExternalAction,
    destroyMailAddressExternalAction
} from '@/services/mail/mailAddressExternal/actions'
import { mailAddressExternalAuth } from '@/services/mail/mailAddressExternal/auth'
import { mailAuth } from '@/services/mail/auth'
import useAuthorizer from '@/hooks/useAuthorizer'
import { useRouter } from 'next/navigation'
import type { MailingList } from '@/prisma-generated-pn-types'
import type { MailFlowObject } from '@/services/mail/types'


export default function EditMailAddressExternal({
    data,
    mailingLists
}: {
    id: number,
    data: MailFlowObject,
    mailingLists: MailingList[]
}) {
    const { push } = useRouter()

    const focusedAddress = data.mailaddressExternal[0]
    if (!focusedAddress) {
        throw Error('Fant ikke ekstern e-postadresse')
    }

    const canUpdate = useAuthorizer({ authorizer: mailAddressExternalAuth.update }).authorized
    const canDestroy = useAuthorizer({ authorizer: mailAddressExternalAuth.destroy }).authorized
    const canAddToList = useAuthorizer({
        authorizer: mailAuth.createMailingListExternalRelation
    }).authorized

    return <>
        <h2>{focusedAddress.address}</h2>
        { canUpdate && <div>
            <Form
                title="Ekstern e-postadresse"
                submitText="Oppdater"
                action={updateMailAddressExternalAction}
            >
                <input type="hidden" name="id" value={focusedAddress.id} />
                <TextInput name="address" label="E-post" defaultValue={focusedAddress.address} />
                <TextInput name="description" label="Beskrivelse" defaultValue={focusedAddress.description} />
            </Form>
        </div>}
        { canDestroy && <div>
            <Form
                action={destroyMailAddressExternalAction.bind(null, { params: { id: focusedAddress.id } })}
                successCallback={() => push('/admin/mail')}
                submitText="Slett"
                submitColor="red"
                confirmation={{
                    confirm: true,
                    text: 'Sikker på at du vil slette denne eksterne adressen? Dette kan ikke angres.',
                }}
            />
        </div> }
        { canAddToList && <div>
            <Form
                title="Legg til e-postliste"
                submitText="Legg til"
                action={createMailingListExternalRelationAction}
            >
                <input type="hidden" name="mailAddressExternalId" value={focusedAddress.id} />
                <SelectNumber
                    options={mailingLists.map(list => ({ value: list.id, label: list.name }))}
                    name="mailingListId"
                    label="E-postliste"
                />
            </Form>
        </div>}
    </>
}
