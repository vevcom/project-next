import styles from './page.module.scss'
import CreateOrUpdateEventForm from './CreateOrUpdateEventForm'
import TagHeaderItem from './TagHeaderItem'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import ArchiveLink from '@/components/HeaderItems/ArchiveLink'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import EventTag from '@/components/Event/EventTag'
import { readCurrentEventsAction } from '@/services/events/actions'
import EventCard from '@/components/Event/EventCard'
import { readEventTagsAction } from '@/services/events/tags/actions'
import { eventTagAuth } from '@/services/events/tags/auth'
import { QueryParams } from '@/lib/queryParams/queryParams'
import { ServerSession } from '@/auth/session/ServerSession'
import Link from 'next/link'
import type { SearchParamsServerSide } from '@/lib/queryParams/types'

type PropTypes = SearchParamsServerSide

export default async function Events({
    searchParams
}: PropTypes) {
    const tagNames = QueryParams.eventTags.decode(await searchParams)

    const currentEventsResponse = await readCurrentEventsAction({ params: { tags: tagNames } })
    const eventTagsResponse = await readEventTagsAction()

    if (!currentEventsResponse.success) {
        throw new Error('Kunne ikke laste kommende arrangementer')
    }
    if (!eventTagsResponse.success) {
        throw new Error('Kunne ikke laste arrangement-tagger')
    }
    const { data: currentEvents } = currentEventsResponse
    const { data: eventTags } = eventTagsResponse

    const currentTags = tagNames ? eventTags.filter(tag => tagNames.includes(tag.name)) : []

    const session = await ServerSession.fromNextAuth()

    const canUpdate = eventTagAuth.update.auth(session)
    const canCreate = eventTagAuth.create.auth(session)
    const canDestroy = eventTagAuth.destroy.auth(session)

    return (
        <PageWrapper title="Hvad der hender" headerItem={
            <div className={styles.header}>
                <div className={styles.tags}>
                    {currentTags.map(tag => {
                        const remainingTags = currentTags
                            .filter(currentTag => currentTag.name !== tag.name)
                            .map(currentTag => currentTag.name)
                        const href = currentTags.length === 1 ?
                            '/events' :
                            `/events?${QueryParams.eventTags.encodeUrl(remainingTags)}`

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
                        page="EVENT"
                    />
                    <AddHeaderItemPopUp popUpKey="CreateEventPopUp">
                        <div className={styles.createEvent}>
                            <CreateOrUpdateEventForm eventTags={eventTags} />
                        </div>
                    </AddHeaderItemPopUp>
                    <ArchiveLink href={tagNames?.length ?
                        `/events/archive?${QueryParams.eventTags.encodeUrl(tagNames)}`
                        :
                        '/events/archive'
                    } />
                </div>
            </div>
        }>
            <div className={styles.wrapper}>
                {
                    currentEvents.map(event =>
                        <EventCard event={event} key={event.id} />
                    )
                }
            </div>
        </PageWrapper>
    )
}
