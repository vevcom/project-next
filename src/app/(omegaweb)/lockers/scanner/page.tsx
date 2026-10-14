'use client'
import styles from './page.module.scss'
import Button from '@/components/UI/Button'
import CameraFeed from '@/components/Camera/CameraFeed'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import { useCallback, useEffect, useRef, useState, useEffectEvent } from 'react'
import type { CameraState } from '@/components/Camera/types'

const WIDTH = 400
const HEIGHT = 400

export default function Scanner() {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [cameraState, setCameraState] = useState<CameraState>('Off')
    const [hasAsked, setHasAsked] = useState<boolean>(false)
    const router = useRouter()

    const constraints = {
        video: {
            facingMode: { ideal: 'environment' },
            width: WIDTH,
            height: HEIGHT
        }
    }

    const callBackFunction = useCallback(() => {
        // The video feed is drawn on a canvas to extract the imageData
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!videoRef.current || !ctx) {
            throw new Error('videoRef.current or ctx is undefined')
        }
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, canvas.width, canvas.height)
        if (code) {
            router.push(code.data)
        }
    }, [router])

    const initializeCamera = useEffectEvent(() => {
        setCameraState('Pending')
        setHasAsked(true)
    })

    useEffect(() => {
        initializeCamera()
    }, [])

    useEffect(() => {
        if (hasAsked && cameraState === 'Off') {
            router.push('/lockers')
        }
    }, [cameraState, hasAsked, router])

    return (
        <>
            <h1 className={styles.title}>Skann QR-kode</h1>
            <div className={styles.camera}>
                <CameraFeed
                    videoRef={videoRef}
                    cameraState={cameraState}
                    setCameraState={setCameraState}
                    constraints={constraints}
                    width={WIDTH}
                    height={HEIGHT}
                    callbackFunction={callBackFunction}
                />

                <Button
                    className={styles.button}
                    onClick={() => { setCameraState('Off') }}
                >
                    Avbryt
                </Button>
            </div>
        </>
    )
}
