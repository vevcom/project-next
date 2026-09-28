import { UpdateCabinProductForm } from './UpdateCabinProductForm'
import { AddHeaderItemPopUp } from '@/app/_components/HeaderItems/HeaderItemPopUp'
import { readCabinProductsAction } from '@/services/cabin/product/actions'
import PageWrapper from '@/app/_components/PageWrapper/PageWrapper'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import SimpleTable from '@/app/_components/Table/SimpleTable'

export default async function CabinProducs() {
    const products = unwrapActionReturn(await readCabinProductsAction())

    return <PageWrapper
        title="Heutte produkter"

        headerItem={<AddHeaderItemPopUp popUpKey="UpdateCabinProductForm">
            <UpdateCabinProductForm />
        </AddHeaderItemPopUp>}
    >

        <SimpleTable
            header={[
                'Produkt',
                'Type',
                'Antall'
            ]}
            body={products.map(product => [
                product.name,
                product.type,
                product.amount.toString()
            ])}
            links={products.map(product => `/admin/cabin-product/${product.id}`)}
        />
    </PageWrapper>
}

