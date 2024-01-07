
//  Pinia，一个状态管理库，用于管理应用的认证状态
import { defineStore } from 'pinia'
import { getWxToken, removeWxToken, setWxToken } from './wx-helper'
import { store } from '@/store'
import { fetchWxUser } from '@/api/wx-index'

// 会话响应的结构
interface WechatResponse {
    wx_token: string
    user_info: {
        nickname: string;
    }
}

export interface WxAuthState {
    wx_token: string | undefined
    data: WechatResponse | null
}

export const wxUserAuthStore = defineStore('wx-auth-store', {
    state: (): WxAuthState => ({
        wx_token: getWxToken(),
        data: null
    }),
    actions: {
        async getWxUser(queryParams:string) {
            try {
                const { data } = await fetchWxUser<WechatResponse>(queryParams)
                this.data = { ...data }
                // 设置token
                setWxToken(this.data.wx_token)
                return Promise.resolve(data)
            }
            catch (error) {
                removeWxToken()
                return Promise.reject(error)
            }
        },


        setWxToken(token: string) {
            console.log(token )
            this.wx_token = token
            setWxToken(token)
        },

        removeWxToken() {
            this.wx_token = undefined
            removeWxToken()
        },
    },
})
// 通过 wxUseAuthStoreWithout 并不会让 wxUserAuthStore 的 actions 执行
export function wxUseAuthStoreWithout() {
    return wxUserAuthStore(store)
}
