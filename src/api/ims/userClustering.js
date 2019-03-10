import request from '@/utils/request'

const Url = '/ims/userClustering'

export default {
  fetchList: (query) => {
    return request({
      url: Url,
      method: 'get',
      params: query
    })
  },
  fetchArticle: (id) => {
    return request({
      url: Url,
      method: 'get',
      params: { id }
    })
  },
  create: (data) => {
    return request({
      url: Url,
      method: 'post',
      data
    })
  },
  update: (data) => {
    const param = {}
    param.where = {}
    param.where.id = data.id
    param.data = data
    return request({
      url: Url + '/update',
      method: 'post',
      data: param
    })
  },
  getLog: (data) => {
    return request({
      url: Url + '/getLog',
      method: 'get',
      params: data
    })
  }
}

