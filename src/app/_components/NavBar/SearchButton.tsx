'use client'
import { useGlobalSearch } from '@/contexts/GlobalSearch'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

export default function SearchButton() {
    const { setIsOpen } = useGlobalSearch()

    return (
        <button
            type="button"
            className="cursor-pointer [background:none] border-none p-0 flex"
            aria-label="Søk"
            title="Søk (⌘K / Ctrl+K)"
            onClick={() => setIsOpen(true)}
        >
            <FontAwesomeIcon className={[
                'w-[40px]! h-[40px]! p-2 rounded-[calc(2*var(--gap))] text-text transition-all duration-300',
                'hover:bg-accent-blue',
            ].join(' ')} icon={faMagnifyingGlass} />
        </button>
    )
}
