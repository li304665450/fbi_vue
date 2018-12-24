import request from '@/utils/request'

export default {
  fetchTree() {
    return request({
      url: '/system/game/getTree',
      method: 'get'
    })
  }
}

