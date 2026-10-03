import styles from './page.module.scss'
import EventArchiveList from './EventArchiveList'
import TagHeaderItem from '@/app/events/TagHeaderItem'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import EventTag from '@/components/Event/EventTag'
import { readEventTagsAction } from '@/services/events/tags/actions'
import { EventArchivePagingProvider } from '@/contexts/paging/EventArchivePaging'
import { ServerSession } from '@/auth/session/ServerSession'
import { QueryParams } from '@/lib/queryParams/queryParams'
import { eventTagAuth } from '@/services/events/tags/auth'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import type { SearchParamsServerSide } from '@/lib/queryParams/types'

type PropTypes = SearchParamsServerSide

export default async function EventArchive({
    searchParams
}: PropTypes) {
    const tagNames = QueryParams.eventTags.decode(await searchParams)

    const eventTagsResponse = await readEventTagsAction()
    if (!eventTagsResponse.success) {
        throw new Error('Kunne ikke laste arrangement-tagger')
    }
    const { data: eventTags } = eventTagsResponse

    const currentTags = tagNames ? eventTags.filter(tag => tagNames.includes(tag.name)) : []

    const session = await ServerSession.fromNextAuth()

    const canUpdate = eventTagAuth.update.auth(session)
    const canCreate = eventTagAuth.create.auth(session)
    const canDestroy = eventTagAuth.destroy.auth(session)

    return (
        <PageWrapper title="Hvad der har hendt" headerItem={
            <div className={styles.header}>
                <div className={styles.tags}>
                    {currentTags.map(tag => {
                        const remainingTags = currentTags
                            .filter(currentTag => currentTag.name !== tag.name)
                            .map(currentTag => currentTag.name)
                        const href = currentTags.length === 1 ?
                            '/events/archive' :
                            `/events/archive?${QueryParams.eventTags.encodeUrl(remainingTags)}`

                        return (
                            <Link key={tag.name} href={href}>
                                <EventTag eventTag={tag} />
                            </Link>
                        )
                    })}
                </div>
                <div className={styles.actions}>
                    <TagHeaderItem
                        eventTags={eventTags}
                        currentTags={currentTags}
                        canUpdate={canUpdate.authorized}
                        canCreate={canCreate.authorized}
                        canDestroy={canDestroy.authorized}
                        page="EVENT_ARCHIVE"
                    />
                    <Link
                        href={tagNames?.length ? `/events?${QueryParams.eventTags.encodeUrl(tagNames)}` : '/events'}
                        className={styles.backLink}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </Link>
                </div>
            </div>
        }>
            <EventArchivePagingProvider serverRenderedData={[]} startPage={{
                page: 0,
                pageSize: 12
            }} details={{ tags: tagNames }}>
                <EventArchiveList />
            </EventArchivePagingProvider>
        </PageWrapper>
    )
}
