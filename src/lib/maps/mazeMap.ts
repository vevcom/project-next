import { z } from 'zod'

export const mazeMapLocationSchema = z.object({
    campusId: z.number().int().positive().optional(),
    zLevel: z.number().int().optional(),
    center: z.object({
        x: z.number().finite().min(-180).max(180),
        y: z.number().finite().min(-90).max(90),
    }).optional(),
    zoom: z.number().finite().min(0).max(24)
        .optional(),
    sharePoi: z.number().int().positive(),
})

export type MazeMapLocation = z.infer<typeof mazeMapLocationSchema>

/** Read the full link from MazeMap's share menu, without accepting arbitrary iframe URLs. */
export function parseMazeMapUrl(value: string): MazeMapLocation | null {
    try {
        const url = new URL(value)
        if (url.origin !== 'https://use.mazemap.com' || url.username || url.password) return null
        if (!['/', '/embed.html'].includes(url.pathname)) return null
        const params = new URLSearchParams(url.hash.slice(1) || url.search.slice(1))
        if (params.get('sharepoitype') !== 'poi') return null
        const center = params.get('center')?.split(',')
        if (center && (center.length !== 2 || center.some(coordinate => !coordinate.trim()))) return null
        const optionalNumber = (name: string) => (params.has(name) ? Number(params.get(name) || NaN) : undefined)
        const result = mazeMapLocationSchema.safeParse({
            campusId: optionalNumber('campusid'),
            zLevel: optionalNumber('zlevel'),
            center: center ? { x: Number(center[0]), y: Number(center[1]) } : undefined,
            zoom: optionalNumber('zoom'),
            sharePoi: optionalNumber('sharepoi'),
        })
        return result.success ? result.data : null
    } catch {
        return null
    }
}

export function getMazeMapUrls(location: MazeMapLocation) {
    const params = new URLSearchParams({ sharepoitype: 'poi', sharepoi: String(location.sharePoi) })
    params.set('v', '1')
    if (location.campusId !== undefined) params.set('campusid', String(location.campusId))
    if (location.zLevel !== undefined) params.set('zlevel', String(location.zLevel))
    if (location.zoom !== undefined) params.set('zoom', String(location.zoom))
    if (location.center) params.set('center', `${location.center.x},${location.center.y}`)
    const href = `https://use.mazemap.com/#${params}`
    params.set('utm_medium', 'iframe')
    return { href, src: `https://use.mazemap.com/embed.html#${params}` }
}
