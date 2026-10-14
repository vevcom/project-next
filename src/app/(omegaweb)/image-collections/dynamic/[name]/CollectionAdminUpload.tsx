'use client'
import styles from './CollectionAdminUpload.module.scss'
import Dropzone from '@/components/UI/Dropzone'
import Form from '@/components/Form/Form'
import Slider from '@/components/UI/Slider'
import ProgressBar from '@/components/ProgressBar/ProgressBar'
import TextInput from '@/components/UI/TextInput'
import LicenseChooser from '@/components/LicenseChooser/LicenseChooser'
import { uploadManyImagesToDynamicCollectionAction } from '@/services/images/dynamic/actions'
import { maxImageCountInOneBatch } from '@/services/images/subservice/constants'
import { useCallback, useState } from 'react'
import type { FileWithStatus } from '@/components/UI/Dropzone'
import type { ActionReturn } from '@/services/actionTypes'

type PropTypes = {
    collectionId: number
    refreshImages: () => void
}

export default function CollectionAdminUpload({ collectionId, refreshImages }: PropTypes) {
    const [files, setFiles] = useState<FileWithStatus[]>([])
    const [progress, setProgress] = useState<number | null>(null)

    const handleBatchedUpload = useCallback(async (data: FormData) => {
        // split files into batches of maxNumberOfImagesInOneBatch
        const batches = files.reduce((acc, file, index) => {
            if (index % maxImageCountInOneBatch === 0) {
                acc.push([])
            }
            acc[acc.length - 1].push(file)
            return acc
        }, [] as FileWithStatus[][])
        const doneFiles: FileWithStatus[] = []

        const useFileName = data.get('useFileName') === 'on'
        const credit = typeof data.get('imageCredit') === 'string' ? data.get('imageCredit') : undefined
        const licenseId = typeof data.get('imageLicenseId') === 'string' ? data.get('imageLicenseId') : undefined

        let res: ActionReturn<void> = { success: true, data: undefined }
        setProgress(0)
        const progressIncrement = 1 / batches.length
        for (const batch of batches) {
            const formData = new FormData()
            if (credit) formData.append('imageCredit', credit)
            if (licenseId) formData.append('imageLicenseId', licenseId)
            batch.forEach(file => {
                formData.append('imageFiles', file.file)
            })
            setFiles(prev => prev.map(file => {
                if (batch.includes(file)) {
                    return { ...file, uploadStatus: 'uploading' }
                }
                return file
            }))
            res = await uploadManyImagesToDynamicCollectionAction({ params: { useFileName, collectionId } }, formData)
            if (res.success) {
                doneFiles.push(...batch)
                setFiles(files.map(file => {
                    if (doneFiles.includes(file)) {
                        return { ...file, uploadStatus: 'done' }
                    }
                    return file
                }))
                setProgress(prev => (prev ?? 0) + progressIncrement)
            } else {
                setProgress(null)
                setFiles(files.map(file => {
                    if (batch.includes(file)) {
                        return { ...file, uploadStatus: 'error' }
                    }
                    return file
                }))
                return res
            }
        }
        setProgress(null)
        setFiles([])
        return res
    }, [files, collectionId])

    return (
        <Form
            className={styles.uploadMany}
            successCallback={refreshImages}
            closePopUpOnSuccess="UploadImages"
            title="Last opp bilder"
            submitText="Last opp"
            action={handleBatchedUpload}
        >
            <Dropzone label="Last opp" name="files" files={files} setFiles={setFiles}/>
            <TextInput name="imageCredit" label="Kreditering" />
            <LicenseChooser name="imageLicenseId" />
            <Slider label="Bruk filnavn som navn" name="useFileName" />
            {
                progress ? <ProgressBar progress={progress} /> : <></>
            }
        </Form>
    )
}
