import logger from '@/lib/logger'

/**
 * @returns Limits for the migration process to test without going crazy
 * null means no limit and happens if the env variable MIGRATION_WITH_LIMITS is set to "false"
 */
export function getLimits() {
    const limits = {
        ombul: 5,
        numberOffFullImageCollections: 0,
        omegaquotes: null,
        articles: 10,
        mailaliases: 0,
        events: 10,
        users: 100,
        images: 10,
        moneyPayments: 100,
        moneyDeposits: 100,
        moneyTransfers: 100,
    }
    const nullObj: { [key in keyof typeof limits]: null } = {
        ombul: null,
        numberOffFullImageCollections: null,
        omegaquotes: null,
        articles: null,
        mailaliases: null,
        events: null,
        users: null,
        images: null,
        moneyPayments: null,
        moneyDeposits: null,
        moneyTransfers: null,
    }

    const limitsOn = process.env.MIGRATION_WITH_LIMITS !== 'false'
    logger.info(limitsOn ? `Limits on. Set to: ${limits}` : 'Limits off!!!')

    return limitsOn ? limits : nullObj
}

export type Limits = ReturnType<typeof getLimits>
