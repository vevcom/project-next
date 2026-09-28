/**
 * One condition that has to hold before omega may be incremented, as the state of omega page shows
 * it and as `omegaOrderOperations.create` enforces it.
 */
export type OmegaOrderRequirement = {
    /**
     * Stable identifier, so that the frontend can key on something other than the wording.
     */
    key: string
    description: string
    fulfilled: boolean
    /**
     * What is left to do, when the requirement is not fulfilled.
     */
    detail?: string
}
