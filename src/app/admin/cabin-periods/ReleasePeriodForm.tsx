'use client'

import { createReleasePeriodAction } from '@/services/cabin/releasePeriod/actions'
import Form from '@/app/_components/Form/Form'
import DateInput from '@/app/_components/UI/DateInput'


export default function ReleasePeriodForm() {
    return <Form
        action={createReleasePeriodAction}
        submitText="Lag ny splipp periode"
    >
        <DateInput name="releaseTime" label="Slipp dato" />
        <DateInput name="releaseUntil" label="Slipp intil dato" />
    </Form>
}
