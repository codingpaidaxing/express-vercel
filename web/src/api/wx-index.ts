import { post } from '@/utils/request'

export function fetchWxUser<T>(queryParams: string) {
  console.log("============H5调用微信获取个人信息接口================")
  return post<T>({
    url: `users/wx-user?${queryParams}`,
  })
}

