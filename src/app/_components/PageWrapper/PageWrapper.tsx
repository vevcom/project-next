import styles from './PageWrapper.module.scss'
import React from 'react'

export default function PageWrapper({
    children,
    headerItem,
    //titleClassName,
    fillHeight = false,
    hideTitle = false,
    transparent = false,
    className,
}: {
    children: React.ReactNode,
    headerItem?: React.ReactNode,
    //titleClassName?: string,
    fillHeight?: boolean,
    hideTitle?: boolean,
    /** For pages laid out as islands: drops the wrapper's surface-base panel so the page background shows through. */
    transparent?: boolean,
    /** Extra class for page-specific tweaks (e.g. rounding, spacing) without touching the shared default. */
    className?: string,
}) {
    const wrapperClass = [
        styles.wrapper,
        fillHeight && styles.fillHeight,
        transparent && styles.transparent,
        className,
    ].filter(Boolean).join(' ')

    return (
        <div className={wrapperClass}>
            {!hideTitle && (
                <div className={styles.inlineHeader}>
                    {/* TODO If anyone wants this we can keep it
                    <h1 className={titleClassName}>{ title }</h1>
                    */}

                    <div>
                        { headerItem }
                    </div>
                </div>
            )}

            <div className={styles.body}>
                { children }
            </div>
        </div>
    )
}
