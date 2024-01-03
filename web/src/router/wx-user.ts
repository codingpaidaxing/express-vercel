import type { Router } from 'vue-router'
import { wxUseAuthStoreWithout } from '@/store/modules/auth/wx-user'

export function setupWxUserInfo(router: Router) {
    router.beforeEach(async (to, from, next) => {
        const wxUserAuthStore = wxUseAuthStoreWithout()
        if (!wxUserAuthStore.data) {
            try {
                const data = await wxUserAuthStore.getWxUser()
                console.log(data)
                if (!data)
                    wxUserAuthStore.removeWxToken()
                if (to.path === '/500')
                    next({ name: 'Root' })
                else
                console.log(wxUserAuthStore.wx_token)
                    next()
            }
            catch (error) {
                if (to.path !== '/500')
                    next({ name: '500' })
                else
                    next()
            }
        }
        else {
            next()
        }
    })
}
