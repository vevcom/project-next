import { Require } from '@/auth/authorizer/Require'

export const mailAuth = {
    createAliasMailingListRelation: Require.permission('MAILINGLIST_ADMIN'),
    createMailingListExternalRelation: Require.permission('MAILINGLIST_ADMIN'),
    createMailingListUserRelation: Require.permission('MAILINGLIST_ADMIN'),
    createMailingListGroupRelation: Require.permission('MAILINGLIST_ADMIN'),
    destroyAliasMailingListRelation: Require.permission('MAILINGLIST_ADMIN'),
    destroyMailingListExternalRelation: Require.permission('MAILINGLIST_ADMIN'),
    destroyMailingListUserRelation: Require.permission('MAILINGLIST_ADMIN'),
    destroyMailingListGroupRelation: Require.permission('MAILINGLIST_ADMIN'),
    readMailFlow: Require.permission('MAILINGLIST_USE')
        .permission('MAILALIAS_USE').permission('MAILADDRESS_EXTERNAL_USE'),
    readMailOptions: Require.permission('MAILINGLIST_USE')
        .permission('MAILALIAS_USE').permission('MAILADDRESS_EXTERNAL_USE'),
} as const
