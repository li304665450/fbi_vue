import request from '@/utils/request'

const groupUrl = '/system/user'

export default {
  fetchList: (query) => {
    return request({
      url: groupUrl,
      method: 'get',
      params: query
    })
  },
  fetchArticle: (id) => {
    return request({
      url: groupUrl,
      method: 'get',
      params: { id }
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

