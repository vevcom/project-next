'use client'
import { companyListRenderer } from './CompanyListRenderer'
import styles from './CompanyList.module.scss'
import { CompanyPagingContext } from '@/contexts/paging/CompanyPaging'
import EndlessScroll from '@/components/PagingWrappers/EndlessScroll'
import { useSession } from '@/auth/session/useSession'
import type { ReactNode } from 'react'

type PropTypes = {
    serverRenderedData: ReactNode,
    disableEditing?: boolean,
}

export default function CompanyList({ serverRenderedData, disableEditing }: PropTypes) {
    const session = useSession()
    if (session.loading) {
        return <>laster session...</>
    }
    return (
        <div className={styles.CompanyList}>
            {serverRenderedData}
            <EndlessScroll
                pagingContext={CompanyPagingContext}
                loadingInfoClassName={styles.loadingControl}
                renderer={data => companyListRenderer({ session: session.session, disableEditing })(data)}
            />
        </div>
    )
}
