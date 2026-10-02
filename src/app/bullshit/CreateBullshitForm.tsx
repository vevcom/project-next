'use client'

import styles from './CreateBullshitFrom.module.scss'
import Form from '@/components/Form/Form'
import { createBullshitAction } from '@/services/bullshit/actions'
import Textarea from '@/components/UI/Textarea'
import { configureAction } from '@/services/configureAction'
import { useSession } from '@/auth/session/useSession'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import { useRouter } from 'next/navigation'

export default function CreateBullshitForm() {
    const { refresh } = useRouter()
    const session = useSession()
    if (session.loading || !session.session.user) return null

    return (
        <AddHeaderItemPopUp popUpKey="new_omega_bullshit">
            <Form
                title="Ny Bullshit"
                submitText="Legg til"
                action={configureAction(
                    createBullshitAction,
                    { params: { bullshitAuthPosterId: session.session.user?.id } }
                )}
                successCallback={refresh}
                className={styles.popupForm}
            >
                <Textarea
                    name="quote"
                    label="Bullshit"
                    placeholder="Bullshit"
                    className={styles.textarea}
                />
            </Form>
        </AddHeaderItemPopUp>
    )
}
