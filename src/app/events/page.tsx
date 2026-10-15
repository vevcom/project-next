import CreateOrUpdateEventForm from './CreateOrUpdateEventForm'
import TagHeaderItem from './TagHeaderItem'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import ArchiveLink from '@/components/HeaderItems/ArchiveLink'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import EventTag from '@/components/Event/EventTag'
import { eventOperations } from '@/services/events/operations'
import EventCard from '@/components/Event/EventCard'
import { eventTagOperations } from '@/services/events/tags/operations'
import { eventTagAuth } from '@/services/events/tags/auth'
import { eventAuth } from '@/services/events/auth'
import { QueryParams } from '@/lib/queryParams/queryParams'
import { serverPage } from '@/app/serverPage'
import Link from 'next/link'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ searchParams }: PageOperationArgs) => {
        const tagNames = QueryParams.eventTags.decode(searchParams)

        const [currentEvents, eventTags] = await Promise.all([
            eventOperations.readManyCurrent({ params: { tags: tagNames } }),
            eventTagOperations.readAll({}),
        ])

        return { tagNames, currentEvents, eventTags }
    },
    capabilities: () => ({
        canUpdateTags: eventTagAuth.update,
        canCreateTags: eventTagAuth.create,
        canDestroyTags: eventTagAuth.destroy,
        canCreate: eventAuth.create,
    }),
    metadata: () => ({ title: 'Hvad der hender' }),
    render: ({ data, capabilities }) => {
        const { tagNames, currentEvents, eventTags } = data
        const currentTags = tagNames ? eventTags.filter(tag => tagNames.includes(tag.name)) : []

        return (
            <PageWrapper headerItem={
                <div className="flex justify-between items-center w-full gap-[1em]">
                    <div className={[
                        'flex items-center gap-[1em] [&_a]:no-underline [&_a]:relative',
                        "[&_a:hover]:after:content-['✖'] [&_a:hover]:after:text-[4em] [&_a:hover]:after:text-text",
                        '[&_a:hover]:after:absolute [&_a:hover]:after:left-1/2 [&_a:hover]:after:top-1/2',
                        '[&_a:hover]:after:-translate-1/2',
                    ].join(' ')}>
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
                    <div className="flex items-center gap-[1em]">
                        <TagHeaderItem
                            eventTags={eventTags}
                            currentTags={currentTags}
                            capabilities={capabilities}
                            page="EVENT"
                        />
                        {capabilities.canCreate.authorized && (
                            <AddHeaderItemPopUp popUpKey="CreateEventPopUp">
                                <div className="min-w-[50vw] grid place-content-center">
                                    <CreateOrUpdateEventForm eventTags={eventTags} />
                                </div>
                            </AddHeaderItemPopUp>
                        )}
                        <ArchiveLink href={tagNames?.length ?
                            `/events/archive?${QueryParams.eventTags.encodeUrl(tagNames)}`
                            :
                            '/events/archive'
                        } />
                    </div>
                </div>
            }>
                <div className="row-list">
                    {
                        currentEvents.map(event =>
                            <EventCard event={event} key={event.id} />
                        )
                    }
                </div>
            </PageWrapper>
        )
    },
})

export default page
export { generateMetadata }
