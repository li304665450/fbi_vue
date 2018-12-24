import request from '@/utils/request'

export default {
  fetchList(query) {
    return request({
      url: '/system/user/groupList',
      method: 'get',
      params: query
    })
  },
  create(data) {
    return request({
      url: '/system/user/createGroup',
      method: 'post',
      data
    })
  },
  update(data) {
    return request({
      url: '/system/user/updateGroup',
      method: 'post',
      data
    })
  },
  say() {
    console.log('this is group')
  }
}
