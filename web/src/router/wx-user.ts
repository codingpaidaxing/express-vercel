import type { Router } from 'vue-router'
import { wxUseAuthStoreWithout } from '@/store/modules/auth/wx-user'

export function setupWxUserInfo(router: Router) {
    // 获取完整的 URL
    const fullUrl = window.location.href
    console.log(fullUrl)
    // 解析 URL 中的查询参数
    const urlSearchParams = fullUrl.split('?')[1]
    console.log(urlSearchParams)
    // const urlSearchParams: string = new URLSearchParams(fullUrl.split('?')[1])
    // const queryParams = Object.fromEntries(urlSearchParams.entries())
    console.log('router', router)
    router.beforeEach(async (to, from, next) => {
        const wxUserAuthStore = wxUseAuthStoreWithout()
        if (!wxUserAuthStore.data?.wx_token) {
            try {
                const data = await wxUserAuthStore.getWxUser(urlSearchParams)
                // console.log(data)
                if (!data)
                    wxUserAuthStore.removeWxToken()
                if (to.path === '/500')
                    next({ name: 'Root' })
                else
                    // console.log(wxUserAuthStore.wx_token)
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
