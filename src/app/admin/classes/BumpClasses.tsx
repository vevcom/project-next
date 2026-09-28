'use client'
import { bumpClassesAction } from '@/services/groups/classes/actions'
import Form from '@/components/Form/Form'
import { useRouter } from 'next/navigation'

export default function BumpClasses() {
    const { refresh } = useRouter()

    return (
        <Form
            action={bumpClassesAction}
            successCallback={refresh}
            submitText="Rykk opp klassene"
            confirmation={{
                confirm: true,
                text: 'Dette rykker alle studenter opp én klasse. Er du sikker på at du vil fortsette?'
            }}
        />
    )
}
