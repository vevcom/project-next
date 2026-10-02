'use client'

import MazeMap from '@/components/MazeMap/MazeMap'
import Map from '@/components/Map/Map'
import { getOpenStreetMapUrls, readLocationMap } from '@/lib/maps/locationMap'
import { parseMazeMapUrl } from '@/lib/maps/mazeMap'

type PropTypes = {
    locationMap: unknown,
    height?: string,
}

export default function EventLocationMap({ locationMap, height = '350px' }: PropTypes) {
    const location = readLocationMap(locationMap)
    if (!location) return null
    if (location.provider === 'OPENSTREETMAP') {
        const urls = getOpenStreetMapUrls(location)
        const params = new URLSearchParams({ api: '1', query: `${location.latitude},${location.longitude}` })
        return <>
            <Map key={urls.src} height={height} src={urls.src} title="OpenStreetMap" />
            <a href={`https://www.google.com/maps/search/?${params}`} target="_blank" rel="noopener noreferrer">
                Åpne i Google Maps
            </a>
        </>
    }
    const mazeMapLocation = parseMazeMapUrl(location.url)
    return mazeMapLocation ? <MazeMap height={height} {...mazeMapLocation} /> : null
}
