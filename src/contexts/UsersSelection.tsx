'use client'

import { createContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { UserFiltered } from '@/services/users/types'

type PropTypes = {
    children: ReactNode
}

/**
 * Context designed to be used with UserPagingContext and UserList.
 * If UserList is rendered inside UsersSelectionProvider, it will display a checkbox next to each user.
 * Users are matched by id, since paging hands out a new object for a user every time it refetches.
 */
export const UsersSelectionContext = createContext<{
    users: UserFiltered[]
    addUser: (user: UserFiltered) => void
    removeUser: (user: UserFiltered) => void
    toggle: (user: UserFiltered) => void
    includes: (user: UserFiltered) => boolean
        } | null>(null)

function containsUser(users: UserFiltered[], user: UserFiltered) {
    return users.some(selectedUser => selectedUser.id === user.id)
}

export default function UsersSelectionProvider({ children }: PropTypes) {
    const [users, setUsers] = useState<UserFiltered[]>([])

    const addUser = (user: UserFiltered) => {
        setUsers(previousUsers => (containsUser(previousUsers, user) ? previousUsers : [...previousUsers, user]))
    }
    const removeUser = (user: UserFiltered) => {
        setUsers(previousUsers => previousUsers.filter(selectedUser => selectedUser.id !== user.id))
    }
    const includes = (user: UserFiltered) => containsUser(users, user)
    const toggle = (user: UserFiltered) => {
        if (includes(user)) {
            removeUser(user)
        } else {
            addUser(user)
        }
    }

    return <UsersSelectionContext.Provider value={{ users, addUser, removeUser, toggle, includes }}>
        {children}
    </UsersSelectionContext.Provider>
}
