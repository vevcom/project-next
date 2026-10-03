'use client'
import useAuthorizer from '@/hooks/useAuthorizer'
import Form from '@/components/Form/Form'
import { SelectNumber } from '@/components/UI/Select'
import { createMailingListUserRelationAction } from '@/services/mail/actions'
import { mailAuth } from '@/services/mail/auth'
import type { MailFlowObject } from '@/services/mail/types'
import type { MailingList } from '@/prisma-generated-pn-types'

export default function EditUser({
    data,
    mailingLists
}: {
    id: number,
    data: MailFlowObject,
    mailingLists: MailingList[]
}) {
    const focusedUser = data.user[0]
    if (!focusedUser) {
        throw Error('Could not find user')
    }

    const canAddToList = useAuthorizer({ authorizer: mailAuth.createMailingListUserRelation }).authorized

    return <div>
        <h2>{`${focusedUser.firstname} ${focusedUser.lastname}`}</h2>
        { canAddToList && <Form
            title="Legg til e-postliste"
            submitText="Legg til"
            action={createMailingListUserRelationAction}
        >
            <input type="hidden" name="userId" value={focusedUser.id} />
            <SelectNumber
                options={mailingLists.map(list => ({ value: list.id, label: list.name }))}
                name="mailingListId"
                label="E-postliste"
            />
        </Form>}
    </div>
}
