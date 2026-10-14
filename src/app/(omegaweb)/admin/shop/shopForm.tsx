import { createShopAction } from '@/services/shop/actions'
import Form from '@/app/_components/Form/Form'
import TextInput from '@/app/_components/UI/TextInput'


export default function ShopForm() {
    return <Form
        action={createShopAction}
        submitText="Lag ny butikk"
        refreshOnSuccess
    >
        <TextInput name="name" label="Butikk" />
        <TextInput name="description" label="Beskrivelse" />
    </Form>
}
