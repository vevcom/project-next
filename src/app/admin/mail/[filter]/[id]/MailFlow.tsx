'use client'

import MailList from './mailList'
import styles from './MailFlow.module.scss'
import {
    destroyAliasMailingListRelationAction,
    destroyMailingListExternalRelationAction,
    destroyMailingListGroupRelationAction,
    destroyMailingListUserRelationAction
} from '@/services/mail/actions'
import { mailAuth } from '@/services/mail/auth'
import useAuthorizer from '@/hooks/useAuthorizer'
import type { ActionReturn } from '@/services/actionTypes'
import type { MailFlowObject, MailListTypes } from '@/services/mail/types'

type DestroyFunction = null | ((id: number) => Promise<ActionReturn<null>>)

export default function MailFlow({
    filter,
    id,
    data,
}: {
    filter: MailListTypes,
    id: number,
    data: MailFlowObject,
}) {
    let aliasDestroy: DestroyFunction = null
    let mailingListDestroy: DestroyFunction = null
    let groupDestroy: DestroyFunction = null
    let userDestroy: DestroyFunction = null
    let addressExternalDestroy: DestroyFunction = null

    const canAdminMailingList = useAuthorizer({
        authorizer: mailAuth.destroyAliasMailingListRelation
    }).authorized

    if (filter === 'mailingList' && canAdminMailingList) {
        aliasDestroy = async (mailAliasId: number) => {
            const ret = await destroyAliasMailingListRelationAction({
                data: { mailingListId: id, mailAliasId },
            })
            return { ...ret, data: null }
        }

        addressExternalDestroy = async (mailAddressExternalId: number) => {
            const ret = await destroyMailingListExternalRelationAction({
                data: { mailingListId: id, mailAddressExternalId },
            })
            return { ...ret, data: null }
        }

        userDestroy = async (userId: number) => {
            const ret = await destroyMailingListUserRelationAction({
                data: { mailingListId: id, userId },
            })
            return { ...ret, data: null }
        }

        groupDestroy = async (groupId: number) => {
            const ret = await destroyMailingListGroupRelationAction({
                data: { mailingListId: id, groupId },
            })
            return { ...ret, data: null }
        }
    }

    if (filter === 'alias' && canAdminMailingList) {
        mailingListDestroy = async (mailingListId: number) => {
            const ret = await destroyAliasMailingListRelationAction({
                data: { mailAliasId: id, mailingListId },
            })
            return {
                ...ret,
                data: null,
            }
        }
    }

    if (filter === 'mailaddressExternal' && canAdminMailingList) {
        mailingListDestroy = async (mailingListId: number) => {
            const ret = await destroyMailingListExternalRelationAction({
                data: { mailAddressExternalId: id, mailingListId },
            })
            return {
                ...ret,
                data: null,
            }
        }
    }

    if (filter === 'user' && canAdminMailingList) {
        mailingListDestroy = async (mailingListId: number) => {
            const ret = await destroyMailingListUserRelationAction({
                data: { userId: id, mailingListId },
            })
            return {
                ...ret,
                data: null,
            }
        }
    }

    if (filter === 'group' && canAdminMailingList) {
        mailingListDestroy = async (mailingListId: number) => {
            const ret = await destroyMailingListGroupRelationAction({
                data: { groupId: id, mailingListId },
            })
            return {
                ...ret,
                data: null,
            }
        }
    }

    return <>
        <div className={styles.mailListContainer}>
            <MailList type="alias" items={data.alias} destroyFunction={aliasDestroy}/>
            <MailList type="mailingList" items={data.mailingList} destroyFunction={mailingListDestroy}/>
            <MailList type="group" items={data.group} destroyFunction={groupDestroy} />
            <MailList type="user" items={data.user} destroyFunction={userDestroy} />
            <MailList type="mailaddressExternal" items={data.mailaddressExternal} destroyFunction={addressExternalDestroy} />
        </div>
    </>
}
