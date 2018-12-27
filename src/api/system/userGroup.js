import request from '@/utils/request'

const groupUrl = '/system/userGroup'

export default {
  fetchList(query) {
    return request({
      url: groupUrl,
      method: 'get',
      params: query
    })
  },
  create(data) {
    return request({
      url: groupUrl + '/create',
      method: 'post',
      data
    })
  },
  update(data) {
    return request({
      url: groupUrl,
      method: 'post',
      data
    })
  },
  fetchMap() {
    return request({
      url: groupUrl + '/fetchMap',
      method: 'get'
    })
  }
}
