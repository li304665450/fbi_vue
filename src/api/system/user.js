import request from '@/utils/request'

const groupUrl = '/system/user/'

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
      url: '/article/detail',
      method: 'get',
      params: { id }
    })
  },
  fetchPv: (pv) => {
    return request({
      url: '/article/pv',
      method: 'get',
      params: { pv }
    })
  },
  createArticle: (data) => {
    return request({
      url: '/article/create',
      method: 'post',
      data
    })
  },
  updateArticle: (data) => {
    return request({
      url: '/article/update',
      method: 'post',
      data
    })
  }
}

