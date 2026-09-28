'use client'

import { createPricePeriodAction } from '@/services/cabin/pricePeriod/actions'
import Form from '@/app/_components/Form/Form'
import Checkbox from '@/app/_components/UI/Checkbox'
import DateInput from '@/app/_components/UI/DateInput'


export default function PricePeriodForm() {
    return <Form
        action={createPricePeriodAction}
        submitText="Lag ny pris periode"
    >
        <DateInput name="validFrom" label="Start dato" />
        <Checkbox name="copyPreviousPrices" label="Kopier tidligere priser." defaultChecked />
    </Form>
}
