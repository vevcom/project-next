'use client'
import useAuthorizer from '@/hooks/useAuthorizer'
import Form from '@/components/Form/Form'
import { SelectNumber } from '@/components/UI/Select'
import { createMailingListGroupRelationAction } from '@/services/mail/actions'
import { mailAuth } from '@/services/mail/auth'
import type { MailFlowObject } from '@/services/mail/types'
import type { MailingList } from '@/prisma-generated-pn-types'


export default function EditGroup({
    data,
    mailingLists
}: {
    id: number,
    data: MailFlowObject,
    mailingLists: MailingList[]
}) {
    const focusedGroup = data.group[0]
    if (!focusedGroup) {
        throw Error('Fant ikke gruppen')
    }
    const canAddToList = useAuthorizer({ authorizer: mailAuth.createMailingListGroupRelation }).authorized

    return <div>
        <h2>{focusedGroup.id}</h2>
        { canAddToList && <Form
            title="Legg til e-postliste"
            submitText="Legg til"
            action={createMailingListGroupRelationAction}
        >
            <input type="hidden" name="groupId" value={focusedGroup.id} />
            <SelectNumber
                options={mailingLists.map(list => ({ value: list.id, label: list.name }))}
                name="mailingListId"
                label="E-postliste"
            />
        </Form>}
    </div>
}
