'use client'
import Button from '@/UI/Button'
import { useRouter } from 'next/navigation'

export default function QRButton() {
    const router = useRouter()

    return (
        <Button
            className="w-auto"
            onClick={() => { router.push('/lockers/scanner') }}
        >
            Skann QR-kode
        </Button>
    )
}
