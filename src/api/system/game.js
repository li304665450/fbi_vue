import request from '@/utils/request'

const groupUrl = '/system/game'

export default {
  fetchTree() {
    return request({
      url: '/system/game/getTree',
      method: 'get'
    })
  },
  fetchList() {
    return request({
      url: groupUrl,
      method: 'get'
    })
  },
  create: (data) => {
    return request({
      url: groupUrl + '/create',
      method: 'post',
      data
    })
  },
  update: (data) => {
    return request({
      url: groupUrl,
      method: 'post',
      data
    })
  }
}

