import '@pn-server-only'
import { StandardImageConfig } from './constants'
import { standardImageCollectionAuth, standardImagesImagePanelAuth } from './auth'
import { implementSpecialCollection } from '@/services/images/subservice/special/implement'
import { defineOperation, defineSubOperation } from '@/services/serviceOperation'
import { ServiceError } from '@/services/error'
import logger from '@/lib/logger'
import { StandardImage } from '@/prisma-generated-pn-types'
import { imageOperations } from '@/services/images/subservice/operations'
import { allowedExtensions, expandedImageIncluder } from '@/services/images/subservice/constants'
import { z } from 'zod'
import type { ExpandedImage } from '@/services/images/subservice/types'

const {
    specialCollectionPanelOperations: standardImagesImagePanelOperations,
    generateCollectionFromConfig: generateStandardImagesCollectionFromConfig
} = implementSpecialCollection({
    special: 'STANDARDIMAGES',
    imagePanelAuther: standardImagesImagePanelAuth.dynamicFields({}),
    allowedExtensions,
    config: {
        name: 'Standardbilder',
        description: `
            Bilder som er nødvendige for nettsiden.
            Denne koleksjonen er helt \'statisk\' og skal og kan ikke modifiseres.
            Dersom et standardbilde (et bilde i denne kolleksjonen) mangler vil bildet genereres ut fra
            sin statisk bestemte konfigurasjon.
        `,
    }
})

const generateStandardImageFromConfig = defineSubOperation({
    paramsSchema: () => z.object({
        standardImage: z.nativeEnum(StandardImage)
    }),
    operation: () => async ({ prisma, params }) => {
        const config = StandardImageConfig[params.standardImage]
        const existingImage = await prisma.image.findUnique({
            where: {
                standardImage: params.standardImage
            }
        })
        if (existingImage) {
            await prisma.image.delete({
                where: {
                    standardImage: params.standardImage
                }
            })
        }

        return await imageOperations.uploadImage.internalCall({
            prisma,
            data: await config.standardStoreFile.imageUploadData({
                name: config.name,
                alt: config.alt
            }),
            params: {
                collectionId: (await standardImagesImagePanelOperations.readCollection({})).id,
            },
            operationImplementationFields: {
                uploadAsStandardImage: params.standardImage,
                allowedExtensions,
            }
        })
    }
})

const readStandardImage = defineOperation({
    authorizer: () => standardImageCollectionAuth.readStandardImage.dynamicFields({}),
    paramsSchema: z.object({
        standardImage: z.nativeEnum(StandardImage)
    }),
    operation: async ({ prisma, params }) => {
        const image = await prisma.image.findUnique({
            where: {
                standardImage: params.standardImage
            },
            include: expandedImageIncluder,
        })

        const standardCollection =
            await standardImagesImagePanelOperations.readCollection({})
        const standardImageIsPartOfStandardCollection = standardCollection.id === image?.collectionId

        if (image && standardImageIsPartOfStandardCollection) return image

        if (image) {
            logger.error(`
                Standard image ${params.standardImage} found in database, but not part of the standard collection.
                This should never happen, as the standard collection should be the only collection 
                that can have standard images.
                Generating it again from the config to ensure data integrity.
            `)
        } else {
            logger.error(`
                Standard image ${params.standardImage} not found in database.
                This should never happen, as it should be seeded on every environment.
                Creating it on runtime from the config.     
            `)
        }

        return await generateStandardImageFromConfig.internalCall({
            prisma,
            params: { standardImage: params.standardImage }
        })
    }
})

/**
 * Reads every standard image in two queries rather than one pair per member. The root layout awaits
 * this on every request, so resolving each of the fourteen images individually - each re-reading the
 * same standard collection - is the difference between two round trips and twenty-eight.
 *
 * Anything missing, or sitting outside the standard collection, is regenerated from static config by
 * readStandardImage, which also logs the anomaly. That is done up front and in parallel so the record
 * below stays a pure lookup; in a healthy database nothing is regenerated at all.
 *
 * The record is written out key by key. TypeScript checks that all keys are present at compile time,
 * so adding a StandardImage fails the build until the key is added here. No assertions, no utilities,
 * just a maintenance reminder that this list and the enum must stay in sync.
 */
const readAllStandardImages = defineOperation({
    authorizer: () => standardImageCollectionAuth.readStandardImage.dynamicFields({}),
    operation: async ({ prisma }): Promise<Record<StandardImage, ExpandedImage>> => {
        const standardCollection = await standardImagesImagePanelOperations.readCollection({})
        const imagesInCollection = await prisma.image.findMany({
            where: {
                standardImage: { not: null },
                collectionId: standardCollection.id,
            },
            include: expandedImageIncluder,
        })

        const missing = Object.values(StandardImage).filter(
            standardImage => !imagesInCollection.some(image => image.standardImage === standardImage)
        )
        const regenerated = await Promise.all(
            missing.map(standardImage => readStandardImage({ params: { standardImage } }))
        )
        const allStandardImages = imagesInCollection.concat(regenerated)

        const imageFor = (standardImage: StandardImage): ExpandedImage => {
            const image = allStandardImages.find(candidate => candidate.standardImage === standardImage)
            // Unreachable: each member was either returned by the findMany or just regenerated.
            if (!image) {
                throw new ServiceError('NOT FOUND', `Standard image ${standardImage} could not be resolved`)
            }
            return image
        }

        return {
            DEFAULT_IMAGE: imageFor(StandardImage.DEFAULT_IMAGE),
            DEFAULT_IMAGE_COLLECTION_COVER: imageFor(StandardImage.DEFAULT_IMAGE_COLLECTION_COVER),
            DEFAULT_PROFILE_IMAGE: imageFor(StandardImage.DEFAULT_PROFILE_IMAGE),
            DEFAULT_COMMITTEE_LOGO: imageFor(StandardImage.DEFAULT_COMMITTEE_LOGO),
            LOGO_SIMPLE: imageFor(StandardImage.LOGO_SIMPLE),
            LOGO_WHITE: imageFor(StandardImage.LOGO_WHITE),
            LOGO_WHITE_TEXT: imageFor(StandardImage.LOGO_WHITE_TEXT),
            MAGISK_HATT: imageFor(StandardImage.MAGISK_HATT),
            HOVEDBYGGNINGEN: imageFor(StandardImage.HOVEDBYGGNINGEN),
            BOOKS: imageFor(StandardImage.BOOKS),
            MACHINE: imageFor(StandardImage.MACHINE),
            REALFAGSBYGGET: imageFor(StandardImage.REALFAGSBYGGET),
            FAIR: imageFor(StandardImage.FAIR),
            PWA: imageFor(StandardImage.PWA),
        }
    }
})

export { standardImagesImagePanelOperations, generateStandardImagesCollectionFromConfig }

/**
 * The standard images are housed in the standardcollection - a special image collection.
 * It exposes the method for reading a single standard image, or all of them at once.
 *
 * If the image does not exist in the database, it will be generated from its config,
 * using the generateStandardImageFromConfig operation.
 */
export const standardImageCollectionOperations = {
    readStandardImage,
    readAllStandardImages,
    generateStandardImageFromConfig,
} as const
