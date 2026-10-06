export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return

    const { assertProductionSecrets } = await import('@/lib/productionSecrets')
    assertProductionSecrets()
}
