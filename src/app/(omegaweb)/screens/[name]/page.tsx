import styles from './page.module.scss'

type PropTypes = {
    params: Promise<{
        name: string
    }>
}

export default async function screen({ params }: PropTypes) {
    decodeURIComponent((await params).name)

    return (
        <div className={styles.wrapper}>
            hei dette er en skjerm
        </div>
    )
}
