import { Modal } from 'antd'

export interface ConfirmOptions {
  title?: string
  content?: React.ReactNode
  okText?: string
  cancelText?: string
  okType?: 'primary' | 'danger'
}

/**
 * 弹确认框，返回 Promise：确认 resolve，取消 reject。
 */
export function confirmModal(options: ConfirmOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: options.title || '提示',
      content: options.content,
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      okType: options.okType || 'primary',
      onOk: () => {
        resolve()
      },
      onCancel: () => {
        reject(new Error('cancelled'))
      }
    })
  })
}