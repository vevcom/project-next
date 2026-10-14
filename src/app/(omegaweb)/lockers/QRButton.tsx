'use client'
import styles from './QRButton.module.scss'
import Button from '@/UI/Button'
import { useRouter } from 'next/navigation'

export default function QRButton() {
    const router = useRouter()

    return (
        <Button
            className={styles.QRButton}
            onClick={() => { router.push('/lockers/scanner') }}
        >
            Skann QR-kode
        </Button>
    )
}
