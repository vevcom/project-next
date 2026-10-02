import { getMazeMapUrls, parseMazeMapUrl } from './mazeMap'
import { z } from 'zod'

export const locationMapSchema = z.discriminatedUnion('provider', [
    z.object({
        provider: z.literal('MAZEMAP'),
        url: z.string().trim().max(2000).transform((value, ctx) => {
            const location = parseMazeMapUrl(value)
            if (!location) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bruk en full MazeMap-delingslenke til et sted (POI)' })
                return z.NEVER
            }
            return getMazeMapUrls(location).href
        }),
    }),
    z.object({
        provider: z.literal('OPENSTREETMAP'),
        latitude: z.number().finite().min(-85).max(85),
        longitude: z.number().finite().min(-180).max(180),
    }),
])

export type LocationMap = z.infer<typeof locationMapSchema>
export type OpenStreetMapLocation = Extract<LocationMap, { provider: 'OPENSTREETMAP' }>

export function readLocationMap(value: unknown): LocationMap | null {
    const result = locationMapSchema.safeParse(value)
    return result.success ? result.data : null
}

/** Clear fields belonging to the other provider when switching map type. */
export function getLocationMapData(location: LocationMap) {
    return {
        provider: location.provider,
        url: location.provider === 'MAZEMAP' ? location.url : null,
        latitude: location.provider === 'OPENSTREETMAP' ? location.latitude : null,
        longitude: location.provider === 'OPENSTREETMAP' ? location.longitude : null,
    }
}

export function getOpenStreetMapUrls({ latitude, longitude }: OpenStreetMapLocation) {
    const bbox = [
        Math.max(-180, longitude - 0.005),
        Math.max(-85, latitude - 0.003),
        Math.min(180, longitude + 0.005),
        Math.min(85, latitude + 0.003),
    ].join(',')
    const params = new URLSearchParams({ bbox, layer: 'mapnik', marker: `${latitude},${longitude}` })
    return {
        src: `https://www.openstreetmap.org/export/embed.html?${params}`,
        href: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
    }
}
