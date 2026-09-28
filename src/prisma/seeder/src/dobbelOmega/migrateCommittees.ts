import { owIdToPnId } from './IdMapper'
import { cmsParagraphOperations } from '@/services/cms/paragraphs/operations'
import logger from '@/lib/logger'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { PrismaClient as PrismaClientPn } from '@/prisma-generated-pn-client'
import type { Prisma } from '@/prisma-generated-pn-types'
import type { PrismaClient as PrismaClientOw } from '@/prisma-generated-ow-basic/client'
import type { UserMigrator } from './migrateUsers'
import type { IdMapper } from './IdMapper'

const fileName = fileURLToPath(import.meta.url)
const directoryName = dirname(fileName)

async function readCommitteMarkdown(filename: string): Promise<string> {
    const filepath = join(directoryName, '..', '..', 'cms_paragraphs', 'committees', filename)
    try {
        return await readFile(filepath, 'utf-8')
    } catch {
        return ''
    }
}

/**
 * Creates a CmsParagraph with rendered contentHtml by delegating to the same
 * cmsParagraphOperations.updateContent used by the live app, instead of duplicating
 * the markdown->html pipeline here.
 */
async function createCmsParagraph(pnPrisma: PrismaClientPn, markdown: string) {
    const paragraph = await pnPrisma.cmsParagraph.create({ data: {} })
    await cmsParagraphOperations.updateContent.internalCall({
        prisma: pnPrisma,
        params: { paragraphId: paragraph.id },
        data: { markdown },
    })
    return paragraph
}

async function createCommitteArticleSection(
    pnPrisma: PrismaClientPn,
    filename: string
): Promise<{ create: Prisma.ArticleSectionCreateInput } | undefined> {
    const markdown = await readCommitteMarkdown(filename)
    if (!markdown) return undefined
    const cmsParagraph = await createCmsParagraph(pnPrisma, markdown)
    return {
        create: {
            cmsParagraph: {
                connect: { id: cmsParagraph.id },
            },
        },
    }
}

/**
 * @returns IdMapper - Maps OW Committees.id to the PN Group.id created for that committee
 * (not the Committee.id) since downstream consumers, e.g. ledger group accounts, relate to Group.
 */
export default async function migrateCommittees(
    pnPrisma: PrismaClientPn,
    owPrisma: PrismaClientOw,
    userMigrator: UserMigrator,
    imageIdMap: IdMapper,
): Promise<IdMapper> {
    const committees = await owPrisma.committees.findMany({
        include: {
            CommitteeMembers: true,
            CommitteeMembersHist: true,
        }
    })

    // A membership points at an omega order, and omegaweb-basic knew nothing of the OmegaOrder table,
    // so every order a membership refers to has to exist before any of them can be written.
    const membershipOrders = new Set(committees.flatMap(committee => [
        ...committee.CommitteeMembers.map(member => member.order),
        ...committee.CommitteeMembersHist.map(member => member.order),
    ]))
    await Promise.all(Array.from(membershipOrders, order => pnPrisma.omegaOrder.upsert({
        where: { order },
        update: {},
        create: { order },
    })))

    // Committees land in the order omega is in now. Hardcoding one meant every migrated committee
    // was behind from the moment it arrived, which blocks the next increment until each is migrated.
    const { order: currentOrder } = await pnPrisma.omegaOrder.findFirstOrThrow({
        orderBy: { order: 'desc' },
    })

    const committeeGroupIdMap: IdMapper = await Promise.all(committees.map(async committee => {
        // Omegaweb-basic's inactive committees are what we now call pensioned.
        const pensioned = !committee.active
        const committeeParagraph = await createCmsParagraph(
            pnPrisma, await readCommitteMarkdown(`${committee.shortname}_p.md`)
        )
        const applicationParagraph = await createCmsParagraph(pnPrisma, committee.applicationText || '')
        const committeArticle = await createCommitteArticleSection(pnPrisma, `${committee.shortname}_a.md`)
        const logoImageId = owIdToPnId(imageIdMap, committee.ImageId)

        const newCommittee = await pnPrisma.committee.create({
            data: {
                name: committee.name,
                shortName: committee.shortname,
                pensioned,
                videoLink: committee.applicationVideo,
                logoImage: logoImageId ? {
                    connect: {
                        id: logoImageId
                    }
                } : undefined,
                paragraph: {
                    connect: { id: committeeParagraph.id }
                },
                applicationParagraph: {
                    connect: { id: applicationParagraph.id }
                },
                committeeArticle: {
                    create: {
                        name: committee.name,
                        coverImage: {
                            create: {
                                name: `${committee.shortname}'s bilde`
                            }
                        },
                        articleSections: committeArticle
                    }
                },
                group: {
                    create: {
                        groupType: 'COMMITTEE',
                        order: currentOrder,
                    },
                }
            }
        })

        await Promise.all(committee.CommitteeMembers.map(async member => {
            if (member.UserId === null) {
                logger.warn(`${committee.shortname} has a member that is not connected to a user!`, { committee, member })
                return
            }
            const pnUserId = await userMigrator.getPnUserId(member.UserId)
            await pnPrisma.membership.create({
                data: {
                    groupId: newCommittee.groupId,
                    userId: pnUserId,
                    // A pensioned committee holds no active memberships, whatever basic said.
                    active: !pensioned,
                    admin: member.admin,
                    order: member.order,
                    title: member.position || undefined,
                }
            })
        }))

        await Promise.all(committee.CommitteeMembersHist.map(async member => {
            const pnUserId = await userMigrator.getPnUserId(member.UserId)
            await pnPrisma.membership.create({
                data: {
                    groupId: newCommittee.groupId,
                    userId: pnUserId,
                    active: false,
                    admin: member.admin,
                    order: member.order,
                    title: member.position || undefined,
                }
            })
        }))

        return { owId: committee.id, pnId: newCommittee.groupId }
    }))

    return committeeGroupIdMap
}
