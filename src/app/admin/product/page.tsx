import ProductForm from './productForm'
import styles from './page.module.scss'
import { AddHeaderItemPopUp } from '@/app/_components/HeaderItems/HeaderItemPopUp'
import PageWrapper from '@/app/_components/PageWrapper/PageWrapper'
import { sortObjectsByName } from '@/lib/sortObjects'
import { productOperations } from '@/services/shop/product/operations'
import { serverPage } from '@/app/serverPage'
import { v4 as uuid } from 'uuid'
import Link from 'next/link'

const { page, generateMetadata } = serverPage({
    operation: async () => productOperations.readMany({}),
    metadata: () => ({ title: 'Produkter' }),
    render: ({ data: products }) => (
        <PageWrapper
            headerItem={
                <AddHeaderItemPopUp popUpKey="ProductForm">
                    <ProductForm />
                </AddHeaderItemPopUp>
            }
        >
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Produkt</th>
                        <th>Beskrivelse</th>
                        <th>Strekkode</th>
                    </tr>
                </thead>
                <tbody>
                    {sortObjectsByName(products).map(product => <tr key={uuid()}>
                        <td>
                            <Link
                                style={{ display: 'contents' }}
                                aria-label={`Gå til produktsiden for ${product.name}`}
                                href={`./product/${product.id}`}
                                passHref
                            >
                                {product.name}
                            </Link>
                        </td>
                        <td>{product.description}</td>
                        <td>{product.barcode ?? ''}</td>
                    </tr>)}
                </tbody>
            </table>
        </PageWrapper>
    ),
})

export default page
export { generateMetadata }
