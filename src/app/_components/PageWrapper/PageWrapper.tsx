import React from 'react'

export default function PageWrapper({
    children,
    headerItem,
    fillHeight = false,
    hideTitle = false,
    transparent = false,
    className,
}: {
    children: React.ReactNode,
    headerItem?: React.ReactNode,
    fillHeight?: boolean,
    hideTitle?: boolean,
    /** For pages laid out as islands: drops the wrapper's surface-base panel so the page background shows through. */
    transparent?: boolean,
    /** Extra class for page-specific tweaks (e.g. rounding, spacing) without touching the shared default. */
    className?: string,
}) {
    const wrapperClass = [
        'min-h-full size-full overflow-y-auto self-start',
        '[&_h1]:font-secondary [&_h1]:text-xxl [&_h1]:capitalize',
        // Island pages paint their own panels and own their spacing, so the wrapper drops both.
        transparent ? 'bg-transparent p-0' : 'bg-surface-base p-4',
        // For pages sizing a scrollable body against the height left under the title bar.
        fillHeight && 'flex flex-col',
        className,
    ].filter(Boolean).join(' ')
    const headerClass = [
        'flex flex-row justify-between items-center [&>div]:flex [&>div]:flex-row [&>div]:items-center [&>div]:flex-1',
        transparent && 'pt-4 px-4',
        fillHeight && 'shrink-0',
    ].filter(Boolean).join(' ')

    return (
        <div className={wrapperClass}>
            {!hideTitle && (
                <div className={headerClass}>
                    <div>
                        { headerItem }
                    </div>
                </div>
            )}

            <div className={`min-h-0 ${fillHeight ? 'flex-1' : ''}`}>
                { children }
            </div>
        </div>
    )
}
