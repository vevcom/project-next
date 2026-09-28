import styles from './GroupTypeTable.module.scss'
import Link from 'next/link'

export type GroupTypeTableRow = {
    /** Stable react key - the group id is the natural choice. */
    key: string | number,
    name: string,
    order: number,
    members: number,
    /**
     * Where this group is administered. Left out for group types that have nowhere to go - a class,
     * for instance, is not administered per group.
     */
    href?: string,
}

type PropTypes = {
    rows: GroupTypeTableRow[],
    /**
     * The current omega order, so that a group left behind in an earlier one stands out.
     */
    currentOrder: number,
    nameHeading?: string,
    emptyText?: string,
}

/**
 * The shared listing of the groups of one group type: what it is called, which order it is in and
 * how many active members it has. Each group type's admin page supplies its own rows and decides
 * where a row links to, which is the only thing that differs between them.
 */
export default function GroupTypeTable({
    rows,
    currentOrder,
    nameHeading = 'Navn',
    emptyText = 'Ingen grupper',
}: PropTypes) {
    return (
        <table className={styles.GroupTypeTable}>
            <thead>
                <tr>
                    <th>{nameHeading}</th>
                    <th>Orden</th>
                    <th>Aktive medlemmer</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 && (
                    <tr>
                        <td className={styles.empty} colSpan={3}>{emptyText}</td>
                    </tr>
                )}
                {rows.map(row => {
                    const behind = row.order < currentOrder
                    return (
                        <tr key={row.key}>
                            <th>{row.href ? <Link href={row.href}>{row.name}</Link> : row.name}</th>
                            <td className={behind ? styles.behind : styles.caughtUp}>
                                <span className={styles.order}>{row.order}</span>
                                {behind && (
                                    <span className={styles.note}>
                                        står i en tidligere orden og må migreres til orden {currentOrder}
                                    </span>
                                )}
                            </td>
                            <td>{row.members}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}
