'use client'

import styles from './Map.module.scss'
import Button from '@/components/UI/Button'
import { useEffect, useRef, useState } from 'react'

export type MapProps = {
    height: string,
}

type PropTypes = MapProps & {
    src: string,
    href?: string,
    title: string,
    invertColors?: boolean,
}

export default function Map({ height, src, href, title, invertColors = false }: PropTypes) {
    const [active, setActive] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (active) iframeRef.current?.focus()
    }, [active])

    return <div className={styles.map} onPointerLeave={() => setActive(false)}>
        <div className={`${styles.wrapper} ${invertColors ? styles.inverted : ''}`} style={{ height }}>
            <iframe
                ref={iframeRef}
                title={title}
                src={src}
                className={styles.iframe}
                tabIndex={active ? 0 : -1}
                loading="lazy"
            />
            {!active && <button
                type="button"
                className={styles.overlay}
                onClick={() => setActive(true)}
                aria-label="Aktiver kartet for interaksjon"
            />}
        </div>
        {href && <a href={href} target="_blank" rel="noopener noreferrer">Åpne i {title}</a>}
        {active && <Button type="button" color="secondary" onClick={() => setActive(false)}>
            Deaktiver kartet
        </Button>}
    </div>
}
