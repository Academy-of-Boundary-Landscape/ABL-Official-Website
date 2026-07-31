import axios from 'axios'

// 这个js大概已经作废了，前端现在用的是strapi.js

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API请求失败:', error)
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      if (status === 401) {
        // 未授权，可以跳转到登录页
        console.error('未授权访问')
      } else if (status === 403) {
        // 禁止访问
        console.error('禁止访问')
      } else if (status === 404) {
        // 资源不存在
        console.error('资源不存在')
      } else if (status === 500) {
        // 服务器内部错误
        console.error('服务器内部错误')
      }
      return Promise.reject(data?.error || `请求失败: ${status}`)
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return Promise.reject('网络连接失败，请检查网络设置')
    } else {
      // 请求配置错误
      return Promise.reject('请求配置错误')
    }
  },
)

export function useEventAPI() {
  /**
   * 获取事件列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.per_page - 每页数量
   * @param {string} params.search - 搜索关键词
   * @param {string} params.type - 事件类型
   * @param {string} params.status - 事件状态
   * @param {string} params.priority - 优先级
   * @param {string} params.tags - 标签（逗号分隔）
   * @param {string} params.sort_by - 排序字段
   * @param {string} params.sort_order - 排序方向
   */
  const getEvents = async (params = {}) => {
    const response = await api.get('/events', { params })
    return response
  }

  /**
   * 获取单个事件详情
   * @param {string} eventId - 事件ID
   */
  const getEvent = async (eventId) => {
    const response = await api.get(`/events/${eventId}`)
    return response
  }

  /**
   * 创建新事件
   * @param {Object} eventData - 事件数据
   */
  const createEvent = async (eventData) => {
    const response = await api.post('/events', eventData)
    return response
  }

  /**
   * 更新事件
   * @param {string} eventId - 事件ID
   * @param {Object} eventData - 更新的事件数据
   */
  const updateEvent = async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData)
    return response
  }

  /**
   * 删除事件
   * @param {string} eventId - 事件ID
   */
  const deleteEvent = async (eventId) => {
    const response = await api.delete(`/events/${eventId}`)
    return response
  }

  /**
   * 获取事件类型列表
   */
  const getEventTypes = async () => {
    const response = await api.get('/events/types')
    return response
  }

  /**
   * 获取事件统计信息
   */
  const getEventStats = async () => {
    const response = await api.get('/events/stats')
    return response
  }

  /**
   * 批量删除事件
   * @param {string[]} eventIds - 事件ID数组
   */
  const batchDeleteEvents = async (eventIds) => {
    const response = await api.post('/events/batch-delete', { event_ids: eventIds })
    return response
  }

  /**
   * 批量更新事件状态
   * @param {string[]} eventIds - 事件ID数组
   * @param {string} status - 新状态
   */
  const batchUpdateStatus = async (eventIds, status) => {
    const response = await api.post('/events/batch-update-status', {
      event_ids: eventIds,
      status,
    })
    return response
  }

  /**
   * 导出事件数据
   * @param {Object} params - 导出参数
   */
  const exportEvents = async (params = {}) => {
    const response = await api.get('/events/export', {
      params,
      responseType: 'blob',
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `events_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return response
  }

  /**
   * 上传事件封面图片
   * @param {File} file - 图片文件
   */
  const uploadCoverImage = async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/events/upload-cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response
  }

  return {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventTypes,
    getEventStats,
    batchDeleteEvents,
    batchUpdateStatus,
    exportEvents,
    uploadCoverImage,
  }
}
