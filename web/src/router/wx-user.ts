import type { Router } from 'vue-router'
import { wxUseAuthStoreWithout } from '@/store/modules/auth/wx-user'

export function setupWxUserInfo(router: Router) {
    // 获取当前路由信息
    const currentRoute = router.currentRoute.value

    // 获取完整的 URL 路径
    const fullPath = currentRoute.fullPath

    console.log(fullPath)
    // 获取路由参数
    const routeParams = currentRoute.params

    console.log(routeParams)

    console.log('router', router)
    router.beforeEach(async (to, from, next) => {
        const wxUserAuthStore = wxUseAuthStoreWithout()
        if (!wxUserAuthStore.data?.wx_token) {
            try {
                const data = await wxUserAuthStore.getWxUser()
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
