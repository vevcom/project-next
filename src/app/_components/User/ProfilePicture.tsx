import Image from '@/components/Image/Image'
import type { ExpandedImage } from '@/services/images/subservice/types'

type PropTypes = {
    profileImage: ExpandedImage,
    width: number,
    className?: string
}

export default function ProfilePicture({ profileImage, width, className }: PropTypes) {
    const isStandardProfileImage = profileImage.standardImage === 'DEFAULT_PROFILE_IMAGE'

    return (
        <div className="flex justify-center">
            <Image
                className={[
                    'rounded-full border-3 border-solid border-white bg-white aspect-square',
                    isStandardProfileImage ? 'object-contain p-[12%]' : 'object-cover',
                    className ?? '',
                ].join(' ')}
                image={profileImage}
                width={width}
            />
        </div>
    )
}
