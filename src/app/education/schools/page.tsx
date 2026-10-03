import styles from './page.module.scss'
import { readExpandedSchoolsPageAction } from '@/services/education/schools/actions'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { SchoolPagingProvider } from '@/contexts/paging/SchoolPaging'
import SchoolList from '@/components/School/SchoolList'
import { ServerSession } from '@/auth/session/ServerSession'
import { schoolAuth } from '@/services/education/schools/auth'
import { schoolListRenderer } from '@/components/School/SchoolListRenderer'
import Link from 'next/link'
import type { PageSizeSchool } from '@/contexts/paging/SchoolPaging'

export default async function Schools() {
    const session = await ServerSession.fromNextAuth()
    const isSchoolAdmin = schoolAuth.create.auth(session).authorized

    const pageSizeSchool: PageSizeSchool = 8
    const res = await readExpandedSchoolsPageAction({
        params: {
            paging: {
                page: { pageSize: pageSizeSchool, page: 0, cursor: null },
                details: undefined,
            },
        },
    })
    if (!res.success) throw new Error(res.error?.length ? res.error[0].message : 'Ukjent feil')
    const serverRenderedData = res.data

    return (
        <PageWrapper title="Skoler" headerItem={
            isSchoolAdmin ? (
                <Link href="/admin/schools" className={styles.adminLink}>
                    Gå til administrasjon
                </Link>
            ) : <></>
        }>
            <SchoolPagingProvider
                serverRenderedData={serverRenderedData}
                details={undefined}
                startPage={{ pageSize: pageSizeSchool, page: 1 }}
            >
                <div className={styles.wrapper}>
                    <SchoolList serverRendered={serverRenderedData.map(schoolListRenderer(session.toJsObject()))} />
                </div>
            </SchoolPagingProvider>
        </PageWrapper>
    )
}
