'use client'
import TextInput from '@/components/UI/TextInput'
import Form from '@/components/Form/Form'
import { SelectNumber } from '@/components/UI/Select'
import { createAliasMailingListRelationAction } from '@/services/mail/actions'
import { updateMailAliasAction, destroyMailAliasAction } from '@/services/mail/alias/actions'
import { mailAliasAuth } from '@/services/mail/alias/auth'
import { mailAuth } from '@/services/mail/auth'
import useAuthorizer from '@/hooks/useAuthorizer'
import { useRouter } from 'next/navigation'
import type { MailFlowObject } from '@/services/mail/types'
import type { MailingList } from '@/prisma-generated-pn-types'

export default function EditMailAlias({
    data,
    mailingLists
}: {
    id: number,
    data: MailFlowObject,
    mailingLists: MailingList[]
}) {
    const { push } = useRouter()

    const focusedAlias = data.alias[0]
    if (!focusedAlias) {
        throw Error('Fant ikke aliaset')
    }

    const canAdmin = useAuthorizer({ authorizer: mailAliasAuth.update }).authorized
    const canAddToList = useAuthorizer({ authorizer: mailAuth.createAliasMailingListRelation }).authorized

    return <>
        <h2>{focusedAlias.address}</h2>
        { canAdmin && <div>
            <Form
                title="Alias"
                submitText="Oppdater"
                action={updateMailAliasAction}
            >
                <input type="hidden" name="id" value={focusedAlias.id} />
                <TextInput name="address" label="E-post" defaultValue={focusedAlias.address} />
                <TextInput name="description" label="Beskrivelse" defaultValue={focusedAlias.description} />
            </Form>
        </div>}
        { canAdmin && <div>
            <Form
                action={destroyMailAliasAction.bind(null, { params: { id: focusedAlias.id } })}
                successCallback={() => push('/admin/mail')}
                submitText="Slett"
                submitColor="red"
                confirmation={{
                    confirm: true,
                    text: 'Sikker på at du vil slette dette e-postaliaset? Dette kan ikke angres.',
                }}
            />
        </div> }
        { canAddToList && <div>
            <Form
                title="Legg til e-postliste"
                submitText="Legg til"
                action={createAliasMailingListRelationAction}
            >
                <input type="hidden" name="mailAliasId" value={focusedAlias.id} />
                <SelectNumber
                    options={mailingLists.map(list => ({ value: list.id, label: list.name }))}
                    name="mailingListId"
                    label="E-postliste"
                />
            </Form>
        </div>}
    </>
}
