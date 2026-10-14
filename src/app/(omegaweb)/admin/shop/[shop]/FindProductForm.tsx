'use client'
import { createShopProductConnectionAction } from '@/services/shop/actions'
import Form from '@/app/_components/Form/Form'
import NumberInput from '@/app/_components/UI/NumberInput'
import { SelectNumber } from '@/app/_components/UI/Select'
import type { Product } from '@/prisma-generated-pn-types'


export default function FindProductForm({
    shopId,
    products,
}: {
    shopId: number,
    products: Pick<Product, 'id' | 'name'>[]
}) {
    if (products.length === 0) return <></>

    return <Form
        action={createShopProductConnectionAction}
        submitText="Legg til produkt"
    >
        <SelectNumber name="productId" label="Produkt" options={products.map(product => ({
            label: product.name,
            value: product.id,
        }))} />
        <input type="hidden" name="shopId" value={shopId} />
        <NumberInput name="price" label="Pris" />
    </Form>
}
